import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const asset = await prisma.asset.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            bio: true,
            githubUsername: true,
            role: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
            icon: true,
          },
        },
        versions: {
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          include: {
            user: {
              select: {
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        issues: {
          include: {
            author: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: { comments: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        ciBuilds: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ asset });
  } catch (error: any) {
    console.error("Fetch asset error:", error);
    return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
  }
}
