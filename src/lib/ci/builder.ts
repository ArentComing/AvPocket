import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import AdmZip from "adm-zip";
import YAML from "yaml";
import { prisma } from "@/lib/prisma";
import { injectVirions } from "../pocketmine/virion-injector";
import { inspectPocketMinePackage, computeSha256 } from "../pocketmine/inspector";

const execFileAsync = promisify(execFile);

export interface BuildOptions {
  assetId: string;
  gitRef: string;
  commitHash: string;
  trigger: "WEBHOOK" | "MANUAL" | "RELEASE";
  channel?: "STABLE" | "BETA" | "DEV";
  sourceZipBuffer?: Buffer;
  sourceDir?: string;
  extraVirions?: string[];
}

export interface BuildResult {
  success: boolean;
  buildId: string;
  versionNumber?: string;
  pharPath?: string;
  pharSize?: number;
  log: string;
  error?: string;
}

export async function runCiBuild(options: BuildOptions): Promise<BuildResult> {
  const { assetId, gitRef, commitHash, trigger, channel = "STABLE" } = options;

  // 1. Create CiBuild record in PENDING state
  const buildRecord = await prisma.ciBuild.create({
    data: {
      assetId,
      commitHash: commitHash.substring(0, 12),
      gitRef,
      trigger,
      status: "BUILDING",
      channel,
      log: `[CI] Initializing build for commit ${commitHash.substring(0, 7)} (${gitRef})...\n`,
    },
  });

  const logs: string[] = [
    `=== AvPocket Automated CI Build ===`,
    `Build ID: ${buildRecord.id}`,
    `Asset ID: ${assetId}`,
    `Git Ref:  ${gitRef}`,
    `Commit:   ${commitHash.substring(0, 12)}`,
    `Trigger:  ${trigger}`,
    `Channel:  ${channel}`,
    `Started:  ${new Date().toISOString()}`,
    `----------------------------------------`,
  ];

  const tempDir = os.tmpdir();
  const buildWorkspace = path.join(tempDir, `avpocket_build_${buildRecord.id}`);

  try {
    fs.mkdirSync(buildWorkspace, { recursive: true });
    logs.push(`[Workspace] Created build sandbox at ${buildWorkspace}`);

    // 2. Prepare source files
    if (options.sourceZipBuffer) {
      logs.push(`[Source] Unpacking source zip archive (${(options.sourceZipBuffer.length / 1024).toFixed(1)} KB)...`);
      const zip = new AdmZip(options.sourceZipBuffer);
      zip.extractAllTo(buildWorkspace, true);
    } else if (options.sourceDir && fs.existsSync(options.sourceDir)) {
      logs.push(`[Source] Copying source files from ${options.sourceDir}...`);
      copyFolderSync(options.sourceDir, buildWorkspace);
    } else {
      throw new Error("No source files provided to CI builder");
    }

    // Locate plugin.yml
    let pluginYmlPath = path.join(buildWorkspace, "plugin.yml");
    if (!fs.existsSync(pluginYmlPath)) {
      // Check first level directory (e.g. repo-main/plugin.yml)
      const subdirs = fs.readdirSync(buildWorkspace, { withFileTypes: true }).filter((d) => d.isDirectory());
      for (const sub of subdirs) {
        const subYml = path.join(buildWorkspace, sub.name, "plugin.yml");
        if (fs.existsSync(subYml)) {
          pluginYmlPath = subYml;
          // Flatten workspace to this subdirectory
          logs.push(`[Source] Detected nested root in "${sub.name}/"`);
          break;
        }
      }
    }

    if (!fs.existsSync(pluginYmlPath)) {
      throw new Error("Missing plugin.yml! A valid PocketMine-MP manifest is required.");
    }

    const workingRoot = path.dirname(pluginYmlPath);
    const rawYml = fs.readFileSync(pluginYmlPath, "utf8");
    const parsedYml = YAML.parse(rawYml);

    const pluginName = parsedYml.name || "Plugin";
    const versionNumber = parsedYml.version || "1.0.0";
    const targetApi = Array.isArray(parsedYml.api) ? parsedYml.api[parsedYml.api.length - 1] : parsedYml.api || "5.0.0";

    logs.push(`[Manifest] Found valid plugin.yml:`);
    logs.push(`  - Name:        ${pluginName}`);
    logs.push(`  - Version:     v${versionNumber}`);
    logs.push(`  - Target API:  ${targetApi}`);

    // 3. Resolve and Inject Virions
    const virionsToInject: string[] = [];
    if (Array.isArray(parsedYml.virions)) {
      virionsToInject.push(...parsedYml.virions);
    }
    if (options.extraVirions) {
      virionsToInject.push(...options.extraVirions);
    }

    if (virionsToInject.length > 0) {
      logs.push(`[Virions] Processing ${virionsToInject.length} declared virion dependencies...`);
      const injectionResult = injectVirions(workingRoot, virionsToInject);
      logs.push(...injectionResult.log);
    } else {
      logs.push(`[Virions] No external virions declared.`);
    }

    // 4. Compile .phar package
    const outputPharName = `${pluginName}_v${versionNumber}.phar`;
    const tempPharPath = path.join(tempDir, outputPharName);

    logs.push(`[Compiler] Executing PocketMine Phar Compiler...`);
    const builderScript = path.resolve(process.cwd(), "src/scripts/phar-builder.php");
    const { stdout } = await execFileAsync("php", ["-d", "phar.readonly=0", builderScript, workingRoot, tempPharPath]);
    const compileResult = JSON.parse(stdout);

    if (!compileResult.success) {
      throw new Error(compileResult.error || "Compilation failed");
    }

    logs.push(`[Compiler] Successfully packaged ${compileResult.filesPackaged} files into .phar!`);
    logs.push(`[Compiler] Compiled archive size: ${(compileResult.pharSize / 1024).toFixed(1)} KB`);

    // 5. Automated Security Scan & Inspection
    logs.push(`[Security] Running automated Anti-Backdoor Scanner on built .phar...`);
    const pharBuffer = fs.readFileSync(tempPharPath);
    const inspection = await inspectPocketMinePackage(pharBuffer, outputPharName);

    logs.push(`[Security] Scan complete: Score ${inspection.security.score}/100 - Is Safe: ${inspection.security.isSafe}`);
    if (inspection.security.findings.length > 0) {
      for (const f of inspection.security.findings) {
        logs.push(`  ⚠️ [${f.severity}] ${f.rule}: ${f.message}`);
      }
    }

    if (!inspection.security.isSafe) {
      throw new Error(`Build failed security audit: Found ${inspection.security.criticalCount} critical vulnerability/backdoors!`);
    }

    // 6. Save artifact to storage/uploads
    const uploadsDir = path.resolve(process.cwd(), "storage/uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeFilename = `${assetId}_${Date.now()}_${outputPharName}`;
    const finalArtifactPath = path.join(uploadsDir, safeFilename);
    fs.copyFileSync(tempPharPath, finalArtifactPath);

    const fileHash = computeSha256(pharBuffer);

    // 7. Update or Create AssetVersion in Database
    await prisma.assetVersion.upsert({
      where: {
        assetId_versionNumber: {
          assetId,
          versionNumber,
        },
      },
      update: {
        channel,
        targetApi: String(targetApi),
        filePath: `storage/uploads/${safeFilename}`,
        fileName: outputPharName,
        fileSize: compileResult.pharSize,
        fileHashSha256: fileHash,
        virionsJson: JSON.stringify(virionsToInject),
      },
      create: {
        assetId,
        versionNumber,
        changelog: `Automated CI build from ${gitRef} (${commitHash.substring(0, 7)})`,
        channel,
        targetApi: String(targetApi),
        filePath: `storage/uploads/${safeFilename}`,
        fileName: outputPharName,
        fileSize: compileResult.pharSize,
        fileHashSha256: fileHash,
        virionsJson: JSON.stringify(virionsToInject),
      },
    });

    logs.push(`[Release] Successfully published version v${versionNumber} to market!`);
    logs.push(`----------------------------------------`);
    logs.push(`BUILD SUCCESS in ${Date.now() - buildRecord.createdAt.getTime()}ms`);

    const fullLog = logs.join("\n");

    // 8. Update CiBuild Record as SUCCESS
    await prisma.ciBuild.update({
      where: { id: buildRecord.id },
      data: {
        status: "SUCCESS",
        log: fullLog,
        artifactPath: `storage/uploads/${safeFilename}`,
        artifactSize: compileResult.pharSize,
        completedAt: new Date(),
      },
    });

    return {
      success: true,
      buildId: buildRecord.id,
      versionNumber,
      pharPath: finalArtifactPath,
      pharSize: compileResult.pharSize,
      log: fullLog,
    };
  } catch (error: any) {
    logs.push(`[ERROR] Build failed: ${error.message}`);
    const fullLog = logs.join("\n");

    await prisma.ciBuild.update({
      where: { id: buildRecord.id },
      data: {
        status: "FAILED",
        log: fullLog,
        completedAt: new Date(),
      },
    });

    return {
      success: false,
      buildId: buildRecord.id,
      log: fullLog,
      error: error.message,
    };
  } finally {
    // Cleanup temporary workspace
    try {
      if (fs.existsSync(buildWorkspace)) {
        fs.rmSync(buildWorkspace, { recursive: true, force: true });
      }
    } catch {}
  }
}

function copyFolderSync(from: string, to: string) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach((element) => {
    if (fs.lstatSync(path.join(from, element)).isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    } else {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    }
  });
}
