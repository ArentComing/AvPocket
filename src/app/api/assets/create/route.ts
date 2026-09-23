import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { inspectPocketMinePackage, computeSha256 } from "@/lib/pocketmine/inspector";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "You must be logged in to publish an asset" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const shortDescription = formData.get("shortDescription") as string;
    const descriptionMarkdown = (formData.get("descriptionMarkdown") as string) || "";
    const categorySlug = (formData.get("categorySlug") as string) || "plugins";
    const pricingType = (formData.get("pricingType") as string) || "FREE";
    const price = parseInt((formData.get("price") as string) || "0", 10);
    const versionNumber = (formData.get("versionNumber") as string) || "1.0.0";
    const targetApi = (formData.get("targetApi") as string) || "5.0.0";
    const changelog = (formData.get("changelog") as string) || "Initial release";
    const sourceCodeUrl = (formData.get("sourceCodeUrl") as string) || null;

    if (!file || !title || !shortDescription) {
      return NextResponse.json({ error: "Title, description and file are required" }, { status: 400 });
    }

    // Find category
    let category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    if (!category) {
      category = (await prisma.category.findFirst())!;
    }

    // Generate unique slug
    let baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!baseSlug) baseSlug = "asset";

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.asset.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Save file to storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileHashSha256 = computeSha256(buffer);

    const uploadDir = path.resolve(process.cwd(), "storage/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeFilename = `${slug}_v${versionNumber}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const targetPath = path.join(uploadDir, safeFilename);
    fs.writeFileSync(targetPath, buffer);

    // Save Asset & Version in Prisma Transaction
    const newAsset = await prisma.asset.create({
      data: {
        title,
        slug,
        shortDescription,
        descriptionMarkdown: descriptionMarkdown || `# ${title}\n\n${shortDescription}`,
        type: categorySlug === "virions" ? "VIRION" : categorySlug === "maps" ? "MAP" : categorySlug === "models" ? "MODEL" : "PLUGIN",
        pricingType: pricingType === "PREMIUM" ? "PREMIUM" : "FREE",
        price: pricingType === "PREMIUM" ? Math.max(0, price) : 0,
        status: "APPROVED",
        authorId: payload.userId,
        categoryId: category.id,
        sourceCodeUrl,
        versions: {
          create: {
            versionNumber,
            changelog,
            channel: "STABLE",
            targetApi,
            filePath: `storage/uploads/${safeFilename}`,
            fileName: file.name,
            fileSize: buffer.length,
            fileHashSha256,
          },
        },
      },
      include: {
        versions: true,
      },
    });

    return NextResponse.json({
      success: true,
      asset: {
        id: newAsset.id,
        slug: newAsset.slug,
        title: newAsset.title,
      },
    });
  } catch (error: any) {
    console.error("Asset create error:", error);
    return NextResponse.json({ error: `Failed to create asset: ${error.message}` }, { status: 500 });
  }
}
