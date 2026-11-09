import { describe, it, expect } from 'vitest';
import {
  computeReportDigest,
  generateSigningKeyPair,
  signDigest,
  verifyDigestSignature,
} from '../src/services/crypto';
import { generateReportPdf } from '../src/services/reportPdf';
import { ReportPayload, SignedCompletionReport } from '../src/types/report';

describe('PDFProof Report Generation and Tamper Detection', () => {
  const dummyPayload: ReportPayload = {
    reportId: 'rep_test_verification_001',
    schemaVersion: '1.0.0',
    generatedAt: '2026-11-09T00:00:00.000Z',
    document: {
      filename: 'quantum-computing-principles.pdf',
      fileSize: 1048576,
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      totalPages: 12,
      title: 'Quantum Computing Principles',
    },
    context: {
      assignmentId: 'PHYS-402',
      readerIdentifier: 'Student-842',
      expectedFingerprint: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      fingerprintMatched: true,
    },
    metrics: {
      totalActiveSeconds: 742.5,
      pagesVisitedCount: 12,
      totalPages: 12,
      completionPercentage: 100,
      totalPageVisits: 28,
      sessionCount: 2,
      averageSecondsPerPage: 61.875,
    },
    pageMetrics: [
      {
        pageNumber: 1,
        activeSeconds: 65,
        visitCount: 3,
        maxScrollDepth: 100,
        firstVisit: '2026-11-09T00:01:00.000Z',
        lastVisit: '2026-11-09T00:05:00.000Z',
      },
      {
        pageNumber: 2,
        activeSeconds: 80,
        visitCount: 2,
        maxScrollDepth: 100,
        firstVisit: '2026-11-09T00:05:00.000Z',
        lastVisit: '2026-11-09T00:10:00.000Z',
      },
    ],
    sessions: [
      {
        sessionId: 'sess_1',
        documentId: 'doc_1',
        startedAt: '2026-11-09T00:00:00.000Z',
        endedAt: '2026-11-09T00:12:00.000Z',
        totalDurationSeconds: 720,
        activeReadingSeconds: 650,
        idleSeconds: 70,
        pagesVisited: [1, 2],
        viewportWidth: 1440,
        viewportHeight: 900,
      },
    ],
    methodology: {
      activeTracking: 'IntersectionObserver + Page Visibility API + Inactivity Detector',
      timeEstimationNotice: 'Active time measures browser viewport visibility and user interaction events.',
      privacyGuarantee: '100% Client-Side Evaluation. Zero server telemetry or cloud persistence.',
    },
  };

  it('signs and verifies a valid completion report', async () => {
    const keys = await generateSigningKeyPair();
    const digest = await computeReportDigest(dummyPayload);
    const signature = await signDigest(keys.privateKey, digest);

    const report: SignedCompletionReport = {
      payload: dummyPayload,
      integrity: {
        digestAlgorithm: 'SHA-256',
        canonicalDigest: digest,
        signatureAlgorithm: 'Ed25519',
        signature,
        publicKey: keys.publicKeyBase64,
        keyFingerprint: keys.keyFingerprint,
      },
    };

    // Verification check
    const recalculatedDigest = await computeReportDigest(report.payload);
    expect(recalculatedDigest).toBe(report.integrity.canonicalDigest);

    const signatureValid = await verifyDigestSignature(
      report.integrity.publicKey,
      recalculatedDigest,
      report.integrity.signature
    );
    expect(signatureValid).toBe(true);
  });

  it('detects tampering when payload fields are modified', async () => {
    const keys = await generateSigningKeyPair();
    const digest = await computeReportDigest(dummyPayload);
    const signature = await signDigest(keys.privateKey, digest);

    const report: SignedCompletionReport = {
      payload: dummyPayload,
      integrity: {
        digestAlgorithm: 'SHA-256',
        canonicalDigest: digest,
        signatureAlgorithm: 'Ed25519',
        signature,
        publicKey: keys.publicKeyBase64,
        keyFingerprint: keys.keyFingerprint,
      },
    };

    // Attacker modifies active time from 742.5 to 9999.0
    const tamperedPayload = JSON.parse(JSON.stringify(report.payload)) as ReportPayload;
    tamperedPayload.metrics.totalActiveSeconds = 9999.0;

    const recalculatedDigest = await computeReportDigest(tamperedPayload);
    // Digest should NOT match
    expect(recalculatedDigest).not.toBe(report.integrity.canonicalDigest);

    // If attacker updates canonicalDigest to recalculatedDigest, signature check must fail!
    const signatureValid = await verifyDigestSignature(
      report.integrity.publicKey,
      recalculatedDigest,
      report.integrity.signature
    );
    expect(signatureValid).toBe(false);
  });

  it('generates a valid, non-empty PDF binary report with pdf-lib', async () => {
    const keys = await generateSigningKeyPair();
    const digest = await computeReportDigest(dummyPayload);
    const signature = await signDigest(keys.privateKey, digest);

    const report: SignedCompletionReport = {
      payload: dummyPayload,
      integrity: {
        digestAlgorithm: 'SHA-256',
        canonicalDigest: digest,
        signatureAlgorithm: 'Ed25519',
        signature,
        publicKey: keys.publicKeyBase64,
        keyFingerprint: keys.keyFingerprint,
      },
    };

    const pdfBytes = await generateReportPdf(report);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    // Validate PDF magic bytes: '%PDF-'
    const magic = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(magic).toBe('%PDF-');
  });
});

