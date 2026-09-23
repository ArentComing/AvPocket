import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const targetApi = searchParams.get("api");
    const pricing = searchParams.get("pricing");
    const query = searchParams.get("q");

    const where: any = {
      status: "APPROVED",
    };

    if (categorySlug && categorySlug !== "all") {
      where.category = { slug: categorySlug };
    }

    if (pricing && pricing !== "all") {
      where.pricingType = pricing.toUpperCase();
    }

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { shortDescription: { contains: query } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        versions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            versionNumber: true,
            targetApi: true,
            fileName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = assets.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      shortDescription: a.shortDescription,
      type: a.type,
      pricingType: a.pricingType,
      price: a.price,
      author: a.author,
      category: a.category,
      totalDownloads: a.totalDownloads,
      ratingAvg: a.ratingAvg,
      ratingCount: a.ratingCount,
      latestVersion: a.versions[0]?.versionNumber || "1.0.0",
      targetApi: a.versions[0]?.targetApi || null,
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json({ assets: formatted });
  } catch (error) {
    console.error("Fetch assets error:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}
