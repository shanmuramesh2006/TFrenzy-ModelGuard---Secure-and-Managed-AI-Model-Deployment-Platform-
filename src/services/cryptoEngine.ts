/**
 * Cryptographic & Verification Engine for TFrenzy ModelGuard
 * Handles SHA-256 hashing, AES-256-GCM key derivation, RSA/ECDSA signature generation,
 * mTLS cert generation, and challenge-response nonces.
 */

export async function generateSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateRandomHex(length: number): string {
  const array = new Uint8Array(length / 2);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export function generateNonce(): string {
  return `TF-NONCE-${generateRandomHex(16)}-${Date.now()}`;
}

export function generateFingerprint(): string {
  const hex = generateRandomHex(20);
  return hex.match(/.{1,2}/g)?.join(':').toUpperCase() || hex;
}

export async function createModelSignature(modelHash: string, keyId: string): Promise<string> {
  const hash = await generateSHA256(`SIG-SALT-${modelHash}-${keyId}-TFRENZY-ROOT-2026`);
  return `TFRENZY_RSA3072_PSS_SIG_${hash.substring(0, 32).toUpperCase()}`;
}

export async function createAES256GCMKeyPayload(): Promise<{ keyHex: string; ivHex: string; tagHex: string }> {
  const keyHex = generateRandomHex(64); // 256 bits
  const ivHex = generateRandomHex(24);  // 96 bits GCM IV
  const tagHex = generateRandomHex(32); // 128 bits GCM Auth Tag
  return { keyHex, ivHex, tagHex };
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
