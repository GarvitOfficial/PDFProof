import { describe, it, expect } from 'vitest';
import {
  computeSha256,
  canonicalizeJson,
  computeReportDigest,
  generateSigningKeyPair,
  signDigest,
  verifyDigestSignature,
  encryptReportData,
  decryptReportData,
  bufferToHex,
  hexToBuffer,
  bufferToBase64,
  base64ToBuffer,
} from '../src/services/crypto';
import { ReportPayload } from '../src/types/report';

describe('PDFProof Cryptographic Engine', () => {
  it('computes correct SHA-256 hashes consistently', async () => {
    const text = 'PDFProof-Reading-Telemetry-Verification';
    const hash1 = await computeSha256(text);
    const hash2 = await computeSha256(text);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    // Known SHA-256 of empty string is e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    const emptyHash = await computeSha256('');
    expect(emptyHash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('canonicalizes JSON objects deterministically regardless of key order', () => {
    const objA = { z: 1, a: 'test', m: { b: 2, a: 1 }, arr: [3, 2, 1] };
    const objB = { a: 'test', arr: [3, 2, 1], m: { a: 1, b: 2 }, z: 1 };

    const canonA = canonicalizeJson(objA);
    const canonB = canonicalizeJson(objB);

    expect(canonA).toBe(canonB);
    expect(canonA).toContain('{"a":"test","arr":[3,2,1],"m":{"a":1,"b":2},"z":1}');
  });

  it('generates Ed25519 keypairs, signs digests, and verifies correctly', async () => {
    const keyPair = await generateSigningKeyPair();
    expect(keyPair.publicKeyBase64).toBeTruthy();
    expect(keyPair.privateKeyBase64).toBeTruthy();
    expect(keyPair.keyFingerprint).toHaveLength(64);

    const testDigest = '7d56e625c27f3f3387fe52fdc4516ebc37f3eb63a94943fcf36ebae77d33b2e5';
    const signature = await signDigest(keyPair.privateKey, testDigest);

    expect(signature).toBeTruthy();

    // Verify valid signature
    const isValid = await verifyDigestSignature(
      keyPair.publicKeyBase64,
      testDigest,
      signature
    );
    expect(isValid).toBe(true);

    // Verify tampered digest is rejected
    const tamperedDigest = '8d56e625c27f3f3387fe52fdc4516ebc37f3eb63a94943fcf36ebae77d33b2e5';
    const isTamperedValid = await verifyDigestSignature(
      keyPair.publicKeyBase64,
      tamperedDigest,
      signature
    );
    expect(isTamperedValid).toBe(false);
  });

  it('encrypts and decrypts with AES-256-GCM and PBKDF2 passphrase', async () => {
    const secretReportData = JSON.stringify({
      reportId: 'test-report-123',
      readingTime: 420,
      reader: 'Student #1',
    });
    const passphrase = 'Ultra-Secure-Password-2026!';

    const container = await encryptReportData(
      secretReportData,
      passphrase,
      'test-report-123',
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );

    expect(container.format).toBe('PDFProof-Encrypted-Report-V1');
    expect(container.algorithm).toBe('AES-256-GCM');
    expect(container.ciphertext).toBeTruthy();
    expect(container.salt).toBeTruthy();
    expect(container.iv).toBeTruthy();

    // Successful decryption
    const decrypted = await decryptReportData(container, passphrase);
    expect(decrypted).toBe(secretReportData);

    // Fail with wrong passphrase
    await expect(
      decryptReportData(container, 'Wrong-Passphrase-999')
    ).rejects.toThrow(/Decryption failed/);
  });

  it('converts between Hex, Base64, and Buffer accurately', () => {
    const originalText = 'Hello World of Cryptography';
    const encoder = new TextEncoder();
    const bytes = encoder.encode(originalText);

    const hex = bufferToHex(bytes);
    const fromHex = hexToBuffer(hex);
    expect(bufferToHex(fromHex)).toBe(hex);

    const b64 = bufferToBase64(bytes);
    const fromB64 = base64ToBuffer(b64);
    expect(bufferToBase64(fromB64)).toBe(b64);
  });
});
