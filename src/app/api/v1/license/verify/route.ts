import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { licenseKey, serverIp, serverPort, pmmpVersion } = body;

    if (!licenseKey) {
      return NextResponse.json(
        { valid: false, error: "License key is required" },
        { status: 400 }
      );
    }

    const license = await prisma.licenseRecord.findUnique({
      where: { licenseKey },
      include: {
        purchase: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
            asset: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!license) {
      return NextResponse.json(
        { valid: false, error: "Invalid license key" },
        { status: 403 }
      );
    }

    if (!license.isActive) {
      return NextResponse.json(
        { valid: false, error: "License has been deactivated by the seller" },
        { status: 403 }
      );
    }

    if (license.isBanned) {
      return NextResponse.json(
        { valid: false, error: `License banned: ${license.banReason || "Violation of terms"}` },
        { status: 403 }
      );
    }

    // Update telemetry (IP, Port, PMMP version, lastCheckedAt)
    await prisma.licenseRecord.update({
      where: { id: license.id },
      data: {
        serverIp: serverIp || req.headers.get("x-forwarded-for") || null,
        serverPort: serverPort ? parseInt(serverPort, 10) : null,
        pmmpVersion: pmmpVersion || null,
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json({
      valid: true,
      asset: license.purchase.asset.title,
      assetSlug: license.purchase.asset.slug,
      buyer: license.purchase.user.username,
      licensedAt: license.createdAt.toISOString(),
      expiresAt: null, // Lifetime license
      verifiedBy: "AvPocket DRM / av-api.ir",
    });
  } catch (error: any) {
    console.error("License verify error:", error);
    return NextResponse.json(
      { valid: false, error: "Internal validation service error" },
      { status: 500 }
    );
  }
}

// Also support GET query parameters for simple PMMP file_get_contents calls
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const licenseKey = searchParams.get("key") || searchParams.get("license");

    if (!licenseKey) {
      return NextResponse.json({ valid: false, error: "Missing license key" }, { status: 400 });
    }

    const license = await prisma.licenseRecord.findUnique({
      where: { licenseKey },
      include: {
        purchase: {
          include: {
            user: { select: { username: true } },
            asset: { select: { title: true, slug: true } },
          },
        },
      },
    });

    if (!license || !license.isActive || license.isBanned) {
      return NextResponse.json({ valid: false, error: "Invalid or suspended license" }, { status: 403 });
    }

    // Update last check
    await prisma.licenseRecord.update({
      where: { id: license.id },
      data: { lastCheckedAt: new Date() },
    });

    return NextResponse.json({
      valid: true,
      asset: license.purchase.asset.title,
      buyer: license.purchase.user.username,
      verifiedBy: "AvPocket DRM / av-api.ir",
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Service error" }, { status: 500 });
  }
}
