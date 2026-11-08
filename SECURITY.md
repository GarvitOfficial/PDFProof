# PDFProof Security Architecture & Threat Model

PDFProof is engineered around a **zero-telemetry, client-resident security paradigm**. Every computational step—from PDF byte ingestion and SHA-256 fingerprinting to continuous dwell-time evaluation and Ed25519 cryptographic signing—executes strictly within the reader's browser sandbox.

---

## 1. Core Cryptographic Primitives

PDFProof utilizes the browser-native **Web Cryptography API** (`window.crypto.subtle`) exclusively, avoiding third-party unaudited JavaScript cryptographic libraries for core integrity operations:

| Capability | Standard / Algorithm | Parameters |
| :--- | :--- | :--- |
| **Document Fingerprinting** | SHA-256 (FIPS 180-4) | Calculated directly over original ArrayBuffer bytes |
| **Report Digest** | SHA-256 (FIPS 180-4) | Applied to canonicalized JSON payload |
| **Digital Signatures** | Ed25519 (RFC 8032) | 32-byte public key, 64-byte signature |
| **Key Derivation** | PBKDF2 (RFC 8018) | HMAC-SHA256, 100,000 rounds, 128-bit random salt |
| **Report Encryption** | AES-256-GCM (NIST SP 800-38D) | 256-bit derived key, 96-bit random IV, 128-bit authentication tag |

---

## 2. Threat Model & Security Guarantees

### What PDFProof Guarantees

1. **Zero External Data Exfiltration**:
   - No remote server, cloud API, database, or analytics endpoint receives document content, reading timestamps, or session metadata.
   - Network requests are restricted to static assets (Google Fonts, bundled JS/CSS, and PDF.js worker files).

2. **Tamper-Evidence**:
   - The completion report payload is serialized via deterministic, invariant JSON canonicalization (alphabetical key sorting, normalized types).
   - Any modification to dwell time, visited page lists, scroll depth, or document identifiers alters the canonical SHA-256 digest, causing mathematical verification failure.

3. **Cryptographic Non-Repudiation**:
   - The report is signed by the browser's resident Ed25519 private key.
   - Third-party verifiers can confirm that the report was emitted by the holder of the corresponding public key and hasn't suffered even a single-bit alteration.

4. **Authentic Document Binding**:
   - The SHA-256 hash of the authentic PDF byte-stream is embedded in the signed report.
   - When an auditor supplies the authentic PDF during verification, PDFProof re-hashes the PDF in real time and validates that the report genuinely belongs to that exact file.

---

## 3. Cryptographic Integrity vs. Institutional Identity

> [!IMPORTANT]
> **Essential Disclosure on Verification Boundaries**:
> Cryptographic integrity proves that a report has **not been altered** since signing, and that its contents were computed for a specific SHA-256 document fingerprint.
>
> However, because PDFProof runs client-side without custodial PKI certificates, a generated report does **not** automatically establish institutional identity or prevent someone from generating keys under a pseudonym.
>
> For institutional audits (e.g. university courses, compliance testing), the student/employee should register their public key fingerprint with the institution beforehand.

---

## 4. Passphrase-Protected Encryption (.encrypted)

For users who wish to archive or distribute reading reports securely over untrusted channels:
- Passphrases are never stored or logged.
- Key derivation uses PBKDF2 with SHA-256 and 100,000 iterations to protect against offline brute-force dictionary attacks.
- AES-256-GCM provides authenticated encryption: if ciphertext, salt, or IV are tampered with, decryption fails automatically.

---

## 5. Local Storage (IndexedDB) Privacy

- Stored documents, summaries, and keypairs reside in the origin's private IndexedDB database (`pdfproof_local_db`).
- Users can view current storage consumption and completely purge all data at any moment via the **Settings** panel.
