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
      return NextResponse.json({ error: "You must be logged in to submit an issue" }, { status: 401 });
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
    const { title, issueBody } = body;

    if (!title || !issueBody) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const issue = await prisma.issue.create({
      data: {
        assetId: asset.id,
        authorId: payload.userId,
        title,
        body: issueBody,
        status: "OPEN",
      },
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, issue });
  } catch (error: any) {
    console.error("Issue create error:", error);
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }
}
