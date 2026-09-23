import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const versionNumber = searchParams.get("version");

    const asset = await prisma.asset.findUnique({
      where: { slug },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!asset || asset.versions.length === 0) {
      return NextResponse.json({ error: "Asset or version not found" }, { status: 404 });
    }

    const version = versionNumber
      ? asset.versions.find((v) => v.versionNumber === versionNumber) || asset.versions[0]
      : asset.versions[0];

    // Optional user token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const payload = token ? verifyToken(token) : null;

    // Track download
    await prisma.$transaction([
      prisma.asset.update({
        where: { id: asset.id },
        data: { totalDownloads: { increment: 1 } },
      }),
      prisma.assetVersion.update({
        where: { id: version.id },
        data: { downloadCount: { increment: 1 } },
      }),
      prisma.downloadLog.create({
        data: {
          assetId: asset.id,
          versionId: version.id,
          userId: payload?.userId || null,
        },
      }),
    ]);

    // Check physical file
    const filePath = path.resolve(process.cwd(), version.filePath);
    let fileBuffer: Buffer;

    if (fs.existsSync(filePath)) {
      fileBuffer = fs.readFileSync(filePath);
    } else {
      // Demo / fallback file generator
      fileBuffer = Buffer.from(
        `<?php\n// AvPocket Sample File for ${asset.title} v${version.versionNumber}\n// Target PocketMine API: ${version.targetApi || "5.0.0"}\n`,
        "utf8"
      );
    }

    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${version.fileName}"`);
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Length", fileBuffer.length.toString());

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Failed to download asset" }, { status: 500 });
  }
}
