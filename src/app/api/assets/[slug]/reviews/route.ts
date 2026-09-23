import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "You must be logged in to review" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
    }

    const asset = await prisma.asset.findUnique({
      where: { slug },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const body = await req.json();
    const { rating, comment } = body;

    const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

    // Upsert review
    await prisma.review.upsert({
      where: {
        assetId_userId: {
          assetId: asset.id,
          userId: payload.userId,
        },
      },
      update: {
        rating: numericRating,
        comment: comment || null,
      },
      create: {
        assetId: asset.id,
        userId: payload.userId,
        rating: numericRating,
        comment: comment || null,
      },
    });

    // Recalculate average rating
    const allReviews = await prisma.review.findMany({
      where: { assetId: asset.id },
    });

    const totalStars = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const ratingAvg = allReviews.length > 0 ? parseFloat((totalStars / allReviews.length).toFixed(1)) : 0;
    const ratingCount = allReviews.length;

    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        ratingAvg,
        ratingCount,
      },
    });

    return NextResponse.json({
      success: true,
      ratingAvg,
      ratingCount,
    });
  } catch (error: any) {
    console.error("Review submit error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
