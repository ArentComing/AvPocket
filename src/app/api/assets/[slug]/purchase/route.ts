import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { generateLicenseKey } from "@/lib/license";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Please log in to make a purchase" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const asset = await prisma.asset.findUnique({
      where: { slug },
      include: { author: true },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.pricingType !== "PREMIUM" || asset.price <= 0) {
      return NextResponse.json({ error: "This asset is free and does not require purchase" }, { status: 400 });
    }

    // Check if buyer is author
    if (asset.authorId === payload.userId) {
      return NextResponse.json({ error: "You cannot purchase your own asset" }, { status: 400 });
    }

    // Check existing purchase
    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        userId_assetId: {
          userId: payload.userId,
          assetId: asset.id,
        },
      },
      include: {
        licenseRecord: true,
      },
    });

    if (existingPurchase) {
      return NextResponse.json({
        success: true,
        alreadyOwned: true,
        licenseKey: existingPurchase.licenseKey,
      });
    }

    // Fetch buyer
    const buyer = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    if (buyer.walletBalance < asset.price) {
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          required: asset.price,
          current: buyer.walletBalance,
          missing: asset.price - buyer.walletBalance,
        },
        { status: 402 }
      );
    }

    const licenseKey = generateLicenseKey();
    const authorPayout = Math.floor(asset.price * 0.9); // 90% payout to developer

    // Atomic transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Deduct from buyer
      await tx.user.update({
        where: { id: buyer.id },
        data: { walletBalance: { decrement: asset.price } },
      });

      // 2. Credit author
      await tx.user.update({
        where: { id: asset.authorId },
        data: { walletBalance: { increment: authorPayout } },
      });

      // 3. Create purchase record
      const createdPurchase = await tx.purchase.create({
        data: {
          userId: buyer.id,
          assetId: asset.id,
          amount: asset.price,
          licenseKey,
          status: "COMPLETED",
          licenseRecord: {
            create: {
              licenseKey,
              isActive: true,
            },
          },
        },
      });

      // 4. Create transaction logs
      await tx.transaction.create({
        data: {
          userId: buyer.id,
          type: "PURCHASE",
          amount: -asset.price,
          description: `Purchase of "${asset.title}"`,
          referenceId: `PUR-${createdPurchase.id.substring(0, 8)}`,
          status: "SUCCESS",
        },
      });

      await tx.transaction.create({
        data: {
          userId: asset.authorId,
          type: "SALE_PAYOUT",
          amount: authorPayout,
          description: `Sales revenue for "${asset.title}" (90%)`,
          referenceId: `PAY-${createdPurchase.id.substring(0, 8)}`,
          status: "SUCCESS",
        },
      });

      return createdPurchase;
    });

    return NextResponse.json({
      success: true,
      licenseKey,
      purchaseId: purchase.id,
    });
  } catch (error: any) {
    console.error("Purchase error:", error);
    return NextResponse.json({ error: `Purchase failed: ${error.message}` }, { status: 500 });
  }
}
