import crypto from "crypto";
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import AdmZip from "adm-zip";
import YAML from "yaml";
import { scanPhpCode, compileSecurityReport, SecurityFinding, SecurityReport } from "./security";

const execFileAsync = promisify(execFile);

export interface PluginYmlData {
  name: string;
  version: string;
  api: string | string[];
  main?: string;
  author?: string | string[];
  authors?: string[];
  description?: string;
  website?: string;
  depend?: string[];
  softdepend?: string[];
  commands?: Record<string, any>;
  permissions?: Record<string, any>;
}

export interface PluginInspectionResult {
  isValidPlugin: boolean;
  pluginYml: PluginYmlData | null;
  detectedApi: string;
  allApis: string[];
  name: string;
  version: string;
  description: string;
  authors: string[];
  fileSize: number;
  fileHashSha256: string;
  security: SecurityReport;
  error?: string;
}

export function computeSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function inspectPocketMinePackage(
  fileBuffer: Buffer,
  originalFilename: string
): Promise<PluginInspectionResult> {
  const isPhar = originalFilename.toLowerCase().endsWith(".phar");
  const isZip = originalFilename.toLowerCase().endsWith(".zip");

  const fileSize = fileBuffer.length;
  const fileHashSha256 = computeSha256(fileBuffer);

  let rawPluginYml: string | null = null;
  const findings: SecurityFinding[] = [];

  if (isZip) {
    try {
      const zip = new AdmZip(fileBuffer);
      const zipEntries = zip.getEntries();

      for (const entry of zipEntries) {
        const entryName = entry.entryName.replace(/\\/g, "/");

        // Find plugin.yml
        if (entryName === "plugin.yml" || entryName.endsWith("/plugin.yml")) {
          rawPluginYml = entry.getData().toString("utf8");
        }

        // Scan PHP files for backdoors
        if (entryName.endsWith(".php") && !entry.isDirectory) {
          const code = entry.getData().toString("utf8");
          const fileFindings = scanPhpCode(code, entryName);
          findings.push(...fileFindings);
        }
      }
    } catch (e: any) {
      return {
        isValidPlugin: false,
        pluginYml: null,
        detectedApi: "Unknown",
        allApis: [],
        name: originalFilename.replace(/\.[^/.]+$/, ""),
        version: "1.0.0",
        description: "",
        authors: [],
        fileSize,
        fileHashSha256,
        security: compileSecurityReport([]),
        error: `Failed to read ZIP archive: ${e.message}`,
      };
    }
  } else if (isPhar) {
    // Write buffer to temporary file
    const tempDir = os.tmpdir();
    const tempPharPath = path.join(tempDir, `pmmp_${Date.now()}_${path.basename(originalFilename)}`);
    const extractDir = path.join(tempDir, `pmmp_extracted_${Date.now()}`);

    try {
      fs.writeFileSync(tempPharPath, fileBuffer);

      // Run PHP script helper
      const scriptPath = path.resolve(process.cwd(), "src/scripts/phar-helper.php");
      const { stdout } = await execFileAsync("php", [scriptPath, tempPharPath, "inspect"]);
      const parsed = JSON.parse(stdout);

      if (parsed.pluginYml) {
        rawPluginYml = parsed.pluginYml;
      }

      // Extract all and scan
      try {
        await execFileAsync("php", [scriptPath, tempPharPath, "extract_all", extractDir]);
        const phpFiles = getAllFiles(extractDir, ".php");
        for (const file of phpFiles) {
          const code = fs.readFileSync(file, "utf8");
          const relName = path.relative(extractDir, file).replace(/\\/g, "/");
          findings.push(...scanPhpCode(code, relName));
        }
      } catch {
        // Extraction optional if inspect worked
      }
    } catch (phpErr: any) {
      console.warn("PHP phar extraction warning, falling back to buffer scanner:", phpErr.message);

      // Fallback: Buffer string scan for plugin.yml
      const str = fileBuffer.toString("binary");
      const match = str.match(/name:\s*([^\r\n]+)/);
      if (match) {
        // Simple heuristic extraction from uncompressed phar parts
        const ymlMatch = str.match(/(name:[\s\S]{10,2000}?)(?=\n[A-Z0-9_\-\.\/]{4,}|\x00)/);
        if (ymlMatch) {
          rawPluginYml = ymlMatch[1];
        }
      }
    } finally {
      // Cleanup temp files
      try {
        if (fs.existsSync(tempPharPath)) fs.unlinkSync(tempPharPath);
        if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
      } catch {}
    }
  }

  // Parse YAML if found
  let parsedYml: PluginYmlData | null = null;
  if (rawPluginYml) {
    try {
      parsedYml = YAML.parse(rawPluginYml) as PluginYmlData;
    } catch (yamlErr: any) {
      console.error("YAML parse error:", yamlErr);
    }
  }

  const securityReport = compileSecurityReport(findings);

  if (!parsedYml) {
    return {
      isValidPlugin: false,
      pluginYml: null,
      detectedApi: "Unknown",
      allApis: [],
      name: originalFilename.replace(/\.[^/.]+$/, ""),
      version: "1.0.0",
      description: "",
      authors: [],
      fileSize,
      fileHashSha256,
      security: securityReport,
      error: "No valid plugin.yml found in the archive",
    };
  }

  // Format APIs
  let allApis: string[] = [];
  if (Array.isArray(parsedYml.api)) {
    allApis = parsedYml.api.map(String);
  } else if (parsedYml.api) {
    allApis = [String(parsedYml.api)];
  }

  const detectedApi = allApis[allApis.length - 1] || "5.0.0";

  // Format authors
  let authors: string[] = [];
  if (Array.isArray(parsedYml.authors)) {
    authors = parsedYml.authors.map(String);
  } else if (Array.isArray(parsedYml.author)) {
    authors = parsedYml.author.map(String);
  } else if (parsedYml.author) {
    authors = [String(parsedYml.author)];
  }

  return {
    isValidPlugin: true,
    pluginYml: parsedYml,
    detectedApi,
    allApis,
    name: parsedYml.name || originalFilename.replace(/\.[^/.]+$/, ""),
    version: parsedYml.version || "1.0.0",
    description: parsedYml.description || "",
    authors,
    fileSize,
    fileHashSha256,
    security: securityReport,
  };
}

function getAllFiles(dirPath: string, extension: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, extension, arrayOfFiles);
    } else if (file.endsWith(extension)) {
      arrayOfFiles.push(fullPath);
    }
  }

  return arrayOfFiles;
}
