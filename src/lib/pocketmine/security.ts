export interface SecurityFinding {
  severity: "CRITICAL" | "WARNING" | "INFO";
  rule: string;
  message: string;
  file?: string;
  line?: number;
  snippet?: string;
}

export interface SecurityReport {
  isSafe: boolean;
  score: number; // 0 to 100
  criticalCount: number;
  warningCount: number;
  findings: SecurityFinding[];
}

interface SuspiciousPattern {
  name: string;
  regex: RegExp;
  severity: "CRITICAL" | "WARNING";
  description: string;
}

const PATTERNS: SuspiciousPattern[] = [
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
  {
    name: "Suspicious Network Sockets",
    regex: /\b(fsockopen|pfsockopen|socket_create)\s*\(/i,
    severity: "WARNING",
    description: "Low-level socket creation detected. Plugins should use standard async curl or libasynql.",
  },
  {
    name: "Silent OP Granting",
    regex: /->setOp\s*\(\s*true\s*\)/i,
    severity: "WARNING",
    description: "Player is granted OP permission directly in code.",
  },
];

export function scanPhpCode(code: string, filename: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lines = code.split("\n");

  for (const pattern of PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip commented lines
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) {
        continue;
      }

      if (pattern.regex.test(line)) {
        findings.push({
          severity: pattern.severity,
          rule: pattern.name,
          message: pattern.description,
          file: filename,
          line: i + 1,
          snippet: line.trim().substring(0, 100),
        });
      }
    }
  }

  return findings;
}

export function compileSecurityReport(allFindings: SecurityFinding[]): SecurityReport {
  const criticalCount = allFindings.filter((f) => f.severity === "CRITICAL").length;
  const warningCount = allFindings.filter((f) => f.severity === "WARNING").length;

  let score = 100 - criticalCount * 40 - warningCount * 15;
  if (score < 0) score = 0;

  return {
    isSafe: criticalCount === 0,
    score,
    criticalCount,
    warningCount,
    findings: allFindings,
  };
}
