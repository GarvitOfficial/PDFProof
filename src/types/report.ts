import { PageReadingMetrics, ReadingSession } from './tracking';

export interface ReportPayload {
  reportId: string;
  schemaVersion: string;
  generatedAt: string; // ISO 8601
  
  // Document context
  document: {
    filename: string;
    fileSize: number;
    sha256: string;
    totalPages: number;
    title?: string;
  };

  // Optional contextual metadata
  context: {
    assignmentId?: string;
    readerIdentifier?: string;
    expectedFingerprint?: string;
    fingerprintMatched?: boolean;
    notes?: string;
  };

  // Reading aggregate metrics
  metrics: {
    totalActiveSeconds: number;
    pagesVisitedCount: number;
    totalPages: number;
    completionPercentage: number;
    totalPageVisits: number;
    sessionCount: number;
    averageSecondsPerPage: number;
  };

  // Detailed breakdowns
  pageMetrics: PageReadingMetrics[];
  sessions: ReadingSession[];

  // Tracking methodology acknowledgment
  methodology: {
    activeTracking: 'IntersectionObserver + Page Visibility API + Inactivity Detector';
    timeEstimationNotice: 'Active time measures browser viewport visibility and user interaction events. It reflects estimated reading engagement, not neurological attention.';
    privacyGuarantee: '100% Client-Side Evaluation. Zero server telemetry or cloud persistence.';
  };
}

export interface SignedCompletionReport {
  payload: ReportPayload;
  integrity: {
    digestAlgorithm: 'SHA-256';
    canonicalDigest: string; // Hex string
    signatureAlgorithm: 'Ed25519';
    signature: string; // Base64
    publicKey: string; // Base64
    keyFingerprint: string; // SHA-256 of the public key
  };
}

export interface EncryptedReportContainer {
  format: 'PDFProof-Encrypted-Report-V1';
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2-SHA256';
  iterations: number;
  salt: string; // Base64
  iv: string; // Base64 nonce
  ciphertext: string; // Base64
  createdAt: string;
  reportId: string;
  documentSha256Hint: string; // Short prefix to identify matching doc
}

export interface VerificationResult {
  isValid: boolean;
  tamperDetected: boolean;
  errors: string[];
  warnings: string[];
  digestMatched: boolean;
  signatureVerified: boolean;
  calculatedDigest: string;
  declaredDigest: string;
  publicKey: string;
  keyFingerprint: string;
  report?: SignedCompletionReport;
  documentHashMatched?: boolean; // If original PDF was supplied during verification
}

