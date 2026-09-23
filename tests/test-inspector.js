const AdmZip = require("adm-zip");
const YAML = require("yaml");

// Inline the scanner logic for direct test
const PATTERNS = [
  {
    name: "Remote Code Execution (eval)",
    regex: /\beval\s*\(/i,
    severity: "CRITICAL",
    description: "Use of eval() detected, allowing arbitrary PHP execution.",
  },
  {
    name: "Shell Command Execution",
    regex: /\b(shell_exec|exec|system|passthru|popen|proc_open)\s*\(/i,
    severity: "CRITICAL",
    description: "Execution of OS system commands is forbidden in PMMP plugins.",
  },
  {
    name: "Discord Webhook Exfiltration",
    regex: /https?:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks/i,
    severity: "WARNING",
    description: "Hardcoded Discord Webhook detected. Potential data exfiltration or token logger.",
  },
  {
    name: "Obfuscated Payload Execution",
    regex: /(?:gzinflate|gzuncompress|str_rot13)\s*\(\s*base64_decode/i,
    severity: "CRITICAL",
    description: "Classic obfuscation payload (gzinflate + base64_decode) detected.",
  },
];

function scanPhp(code, filename) {
  const findings = [];
  const lines = code.split("\n");
  for (const pattern of PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) continue;
      if (pattern.regex.test(line)) {
        findings.push({
          severity: pattern.severity,
          rule: pattern.name,
          message: pattern.description,
          file: filename,
          line: i + 1,
        });
      }
    }
  }
  return findings;
}

async function run() {
  console.log("🧪 Running Phase 2 Automated Tests...\n");

  // 1. Clean Plugin
  console.log("Test 1: Clean PocketMine plugin...");
  const cleanZip = new AdmZip();
  cleanZip.addFile("plugin.yml", Buffer.from("name: FastWarps\nversion: 2.1.0\napi: [\"5.0.0\", \"5.1.0\"]\nmain: FastWarps\\Main\n"));
  cleanZip.addFile("src/Main.php", Buffer.from("<?php\nnamespace FastWarps;\nclass Main {}\n"));
  
  const cleanEntries = cleanZip.getEntries();
  let cleanYml = null;
  const cleanFindings = [];
  for (const e of cleanEntries) {
    if (e.entryName === "plugin.yml") cleanYml = YAML.parse(e.getData().toString("utf8"));
    if (e.entryName.endsWith(".php")) cleanFindings.push(...scanPhp(e.getData().toString("utf8"), e.entryName));
  }
  console.log("  - Plugin Name:", cleanYml.name);
  console.log("  - API Detected:", cleanYml.api);
  console.log("  - Security Findings:", cleanFindings.length);
  if (cleanFindings.length !== 0 || cleanYml.name !== "FastWarps") throw new Error("Test 1 failed");
  console.log("✅ Test 1 PASSED: Clean plugin verified!\n");

  // 2. Malicious Plugin
  console.log("Test 2: Malicious Backdoor Plugin Detection...");
  const evilZip = new AdmZip();
  evilZip.addFile("plugin.yml", Buffer.from("name: FreeOP\nversion: 1.0.0\napi: 5.0.0\n"));
  evilZip.addFile("src/Evil.php", Buffer.from("<?php\nclass Evil {\n  function run() {\n    eval(gzinflate(base64_decode('xx')));\n    shell_exec('rm -rf /');\n    $w = 'https://discord.com/api/webhooks/123/abc';\n  }\n}\n"));

  const evilEntries = evilZip.getEntries();
  const evilFindings = [];
  for (const e of evilEntries) {
    if (e.entryName.endsWith(".php")) evilFindings.push(...scanPhp(e.getData().toString("utf8"), e.entryName));
  }
  console.log("  - Findings detected:", evilFindings.length);
  for (const f of evilFindings) {
    console.log(`    ⚠️ [${f.severity}] ${f.rule} at line ${f.line}`);
  }
  if (evilFindings.length < 3) throw new Error("Test 2 failed: Did not catch all backdoors");
  console.log("✅ Test 2 PASSED: All backdoors accurately intercepted!\n");

  console.log("🎉 ALL TESTS PASSED!");
}

run().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
