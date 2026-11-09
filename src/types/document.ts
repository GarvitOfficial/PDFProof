export interface DocumentMeta {
  id: string;
  filename: string;
  fileSize: number;
  fingerprintSha256: string;
  totalPages: number;
  uploadedAt: string; // ISO 8601
  lastReadAt: string | null; // ISO 8601
  expectedFingerprint?: string;
  isFingerprintMatch?: boolean | null;
  title?: string;
  author?: string;
}

export interface StoredDocument {
  meta: DocumentMeta;
  pdfBytes: ArrayBuffer;
}

