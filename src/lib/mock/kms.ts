const MOCK_KEY = "MOCK-KMS-KEY-AES256-GCM";

export function mockEncrypt(plaintext: string): string {
  const encoded = Buffer.from(plaintext).toString("base64");
  return `ENC:${encoded}`;
}

export function mockDecrypt(ciphertext: string): string {
  if (!ciphertext.startsWith("ENC:")) return ciphertext;
  const encoded = ciphertext.slice(4);
  return Buffer.from(encoded, "base64").toString("utf-8");
}

export function maskCCCD(cccd: string): string {
  if (cccd.length < 12) return cccd;
  return cccd.slice(0, 8) + "****";
}

export function getMockKeyId(): string {
  return `KMS-KEY-AUTH-${Date.now().toString().slice(-6)}`;
}
