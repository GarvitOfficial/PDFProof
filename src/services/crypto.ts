import { EncryptedReportContainer, ReportPayload } from '../types/report';

/**
 * PDFProof Cryptographic Services Engine
 * Uses browser-native Web Crypto API exclusively:
 * - SHA-256 for file fingerprinting and canonical payload digests
 * - PBKDF2 (SHA-256, 100,000 iterations) for key derivation from passphrases
 * - AES-256-GCM (12-byte random IV, 128-bit tag) for report encryption
 * - Ed25519 (RFC 8032) for asymmetric digital signatures and auditability
 */

// --- Base64 and Hex encoding helpers ---

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// --- SHA-256 Fingerprinting ---

export async function computeSha256(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  let buffer: BufferSource;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data);
  } else if (data instanceof Uint8Array) {
    buffer = data;
  } else {
    buffer = data;
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return bufferToHex(hashBuffer);
}

// --- Deterministic Canonical JSON Serialization ---

/**
 * Recursively canonicalizes JavaScript objects to produce an invariant JSON string.
 * - Sorts object keys alphabetically
 * - Serializes numbers and booleans consistently
 * - Formats arrays in element order
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalizeJson(item)).join(',') + ']';
  }

  const record = obj as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const pairs = sortedKeys
    .filter((k) => record[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${canonicalizeJson(record[k])}`);

  return '{' + pairs.join(',') + '}';
}

export async function computeReportDigest(payload: ReportPayload): Promise<string> {
  const canonical = canonicalizeJson(payload);
  return computeSha256(canonical);
}

// --- Ed25519 Digital Signatures ---

export interface KeyPairResult {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyBase64: string;
  privateKeyBase64: string;
  keyFingerprint: string;
}

export async function generateSigningKeyPair(): Promise<KeyPairResult> {
  const keyPair = (await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair;

  const rawPub = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const pkcs8Priv = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKeyBase64 = bufferToBase64(rawPub);
  const privateKeyBase64 = bufferToBase64(pkcs8Priv);
  const keyFingerprint = await computeSha256(rawPub);

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyBase64,
    privateKeyBase64,
    keyFingerprint,
  };
}

export async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  const bytes = base64ToBuffer(privateKeyBase64);
  return crypto.subtle.importKey(
    'pkcs8',
    bytes,
    { name: 'Ed25519' },
    false,
    ['sign']
  );
}

export async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const bytes = base64ToBuffer(publicKeyBase64);
  return crypto.subtle.importKey(
    'raw',
    bytes,
    { name: 'Ed25519' },
    true,
    ['verify']
  );
}

export async function signDigest(privateKey: CryptoKey, digestHex: string): Promise<string> {
  const data = new TextEncoder().encode(digestHex);
  const sigBuffer = await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, data);
  return bufferToBase64(sigBuffer);
}

export async function verifyDigestSignature(
  publicKeyBase64: string,
  digestHex: string,
  signatureBase64: string
): Promise<boolean> {
  try {
    const pubKey = await importPublicKey(publicKeyBase64);
    const sigBytes = base64ToBuffer(signatureBase64);
    const data = new TextEncoder().encode(digestHex);
    return await crypto.subtle.verify({ name: 'Ed25519' }, pubKey, sigBytes, data);
  } catch (err) {
    console.warn('Signature verification failure:', err);
    return false;
  }
}

// --- PBKDF2 & AES-256-GCM Encryption / Decryption ---

const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const GCM_IV_LENGTH = 12; // 96-bit recommended for GCM
const SALT_LENGTH = 16;

async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptReportData(
  plainText: string,
  passphrase: string,
  reportId: string,
  documentSha256: string
): Promise<EncryptedReportContainer> {
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('A non-empty passphrase is required for report encryption.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH));
  const key = await deriveAesKey(passphrase, salt);

  const encoded = new TextEncoder().encode(plainText);
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128,
    },
    key,
    encoded
  );

  return {
    format: 'PDFProof-Encrypted-Report-V1',
    algorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(encryptedBuffer),
    createdAt: new Date().toISOString(),
    reportId,
    documentSha256Hint: documentSha256.substring(0, 12),
  };
}

export async function decryptReportData(
  container: EncryptedReportContainer,
  passphrase: string
): Promise<string> {
  if (!container || container.format !== 'PDFProof-Encrypted-Report-V1') {
    throw new Error('Unrecognized or invalid encrypted report container format.');
  }
  if (!passphrase) {
    throw new Error('Passphrase is required to decrypt this report.');
  }

  const salt = base64ToBuffer(container.salt);
  const iv = base64ToBuffer(container.iv);
  const ciphertext = base64ToBuffer(container.ciphertext);

  const key = await deriveAesKey(passphrase, salt);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    throw new Error('Decryption failed: Incorrect passphrase or corrupted/tampered data.');
  }
}
