import crypto from "crypto";

/**
 * Generates an AvPocket License Key in format: AVP-XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Base32 excluding confusing 0/O, 1/I
  const segments: string[] = ["AVP"];

  for (let s = 0; s < 4; s++) {
    let segment = "";
    for (let i = 0; i < 4; i++) {
      const rand = crypto.randomInt(0, chars.length);
      segment += chars[rand];
    }
    segments.push(segment);
  }

  return segments.join("-");
}
