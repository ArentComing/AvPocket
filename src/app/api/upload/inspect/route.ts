import { NextResponse } from "next/server";
import { inspectPocketMinePackage } from "@/lib/pocketmine/inspector";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filename = file.name;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If it's a plugin or phar/zip, inspect with PocketMine inspector
    if (filename.endsWith(".phar") || filename.endsWith(".zip")) {
      const inspection = await inspectPocketMinePackage(buffer, filename);
      return NextResponse.json({
        success: true,
        inspection,
      });
    }

    // For non-plugin files (e.g. .mcworld, .geo.json), provide general metadata
    return NextResponse.json({
      success: true,
      inspection: {
        isValidPlugin: false,
        name: filename.replace(/\.[^/.]+$/, ""),
        version: "1.0.0",
        fileSize: buffer.length,
        detectedApi: null,
        security: {
          isSafe: true,
          score: 100,
          criticalCount: 0,
          warningCount: 0,
          findings: [],
        },
      },
    });
  } catch (error: any) {
    console.error("Inspect error:", error);
    return NextResponse.json(
      { error: `Inspection failed: ${error.message}` },
      { status: 500 }
    );
  }
}
