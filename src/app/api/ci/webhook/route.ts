import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runCiBuild } from "@/lib/ci/builder";

export async function POST(req: Request) {
  try {
    const event = req.headers.get("x-github-event") || "push";
    const body = await req.json();

    const repoFullName = body.repository?.full_name;
    if (!repoFullName) {
      return NextResponse.json({ error: "Missing repository in webhook payload" }, { status: 400 });
    }

    // Find matching asset
    const asset = await prisma.asset.findFirst({
      where: {
        OR: [
          { githubRepo: repoFullName },
          { sourceCodeUrl: { contains: repoFullName } },
        ],
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: `No registered AvPocket asset found for repository: ${repoFullName}` },
        { status: 404 }
      );
    }

    const gitRef = body.ref || (body.release ? `refs/tags/${body.release.tag_name}` : "refs/heads/main");
    const commitHash = body.after || body.head_commit?.id || body.release?.target_commitish || "000000000000";

    // Determine release channel
    const isTag = gitRef.startsWith("refs/tags/");
    const channel = isTag ? "STABLE" : "DEV";

    // Download repository zipball from GitHub
    const archiveUrl = `https://api.github.com/repos/${repoFullName}/zipball/${gitRef.replace("refs/heads/", "").replace("refs/tags/", "")}`;
    
    let zipBuffer: Buffer | undefined;
    try {
      const zipRes = await fetch(archiveUrl, {
        headers: {
          "User-Agent": "AvPocket-CI-Builder",
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (zipRes.ok) {
        const arrayBuf = await zipRes.arrayBuffer();
        zipBuffer = Buffer.from(arrayBuf);
      }
    } catch (fetchErr) {
      console.warn("Could not download GitHub zipball directly, continuing with demo payload");
    }

    // Trigger CI Build asynchronously
    const buildResult = await runCiBuild({
      assetId: asset.id,
      gitRef,
      commitHash,
      trigger: event === "release" ? "RELEASE" : "WEBHOOK",
      channel,
      sourceZipBuffer: zipBuffer,
    });

    return NextResponse.json({
      received: true,
      event,
      repository: repoFullName,
      assetSlug: asset.slug,
      build: buildResult,
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: `Webhook error: ${error.message}` }, { status: 500 });
  }
}
