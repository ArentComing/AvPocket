import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const amount = parseInt(body.amount, 10);

    if (!amount || amount < 1000) {
      return NextResponse.json({ error: "Minimum deposit is 1,000 Tomans" }, { status: 400 });
    }

    const refId = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: payload.userId },
        data: { walletBalance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          amount,
          description: `Direct wallet top-up via payment gateway`,
          referenceId: refId,
          status: "SUCCESS",
        },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      newBalance: updatedUser.walletBalance,
      referenceId: refId,
    });
  } catch (error: any) {
    console.error("Deposit error:", error);
    return NextResponse.json({ error: "Failed to process deposit" }, { status: 500 });
  }
}
