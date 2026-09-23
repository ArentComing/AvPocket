import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { runCiBuild } from "@/lib/ci/builder";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
    }

    const body = await req.json();
    const { assetSlug, gitRef = "refs/heads/main", extraVirions } = body;

    const asset = await prisma.asset.findUnique({
      where: { slug: assetSlug },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Must be author or admin
    if (asset.authorId !== payload.userId && payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: You are not the author of this asset" }, { status: 403 });
    }

    // Sample or existing asset folder
    const buildResult = await runCiBuild({
      assetId: asset.id,
      gitRef,
      commitHash: Math.random().toString(16).substring(2, 14),
      trigger: "MANUAL",
      channel: "STABLE",
      extraVirions: extraVirions || [],
      // Use existing demo or repo source
      sourceZipBuffer: undefined,
      sourceDir: undefined,
    });

    return NextResponse.json({
      success: buildResult.success,
      build: buildResult,
    });
  } catch (error: any) {
    console.error("Manual build error:", error);
    return NextResponse.json({ error: `Manual build failed: ${error.message}` }, { status: 500 });
  }
}
