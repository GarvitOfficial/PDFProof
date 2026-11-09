import React, { useRef, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  FileSearch,
  UploadCloud,
  Lock,
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Info,
} from 'lucide-react';
import {
  computeReportDigest,
  computeSha256,
  decryptReportData,
  verifyDigestSignature,
} from '../../services/crypto';
import { EncryptedReportContainer, SignedCompletionReport, VerificationResult } from '../../types/report';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const VerificationView: React.FC = () => {
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Decryption state for .encrypted files
  const [isDecryptModalOpen, setIsDecryptModalOpen] = useState(false);
  const [encryptedContainer, setEncryptedContainer] = useState<EncryptedReportContainer | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [decryptError, setDecryptError] = useState<string | null>(null);

  const reportInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const handleReportFile = async (file: File) => {
    setReportFile(file);
    setVerificationResult(null);
    setErrorMessage(null);

    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('File is not valid JSON or encrypted container.');
      }

      const candidate = parsed as Record<string, unknown>;
      if (candidate.format === 'PDFProof-Encrypted-Report-V1') {
        // Encrypted report
        setEncryptedContainer(candidate as unknown as EncryptedReportContainer);
        setIsDecryptModalOpen(true);
      } else if (candidate.payload && candidate.integrity) {
        // Plain signed report
        await runVerification(candidate as unknown as SignedCompletionReport);
      } else {
        throw new Error('Unrecognized report format.');
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to inspect report file.');
    }
  };

  const handleDecryptAndVerify = async () => {
    if (!encryptedContainer) return;
    setDecryptError(null);
    try {
      const decryptedJsonStr = await decryptReportData(encryptedContainer, passphrase);
      const parsed = JSON.parse(decryptedJsonStr) as SignedCompletionReport;
      setIsDecryptModalOpen(false);
      setPassphrase('');
      await runVerification(parsed);
    } catch (err: unknown) {
      setDecryptError((err as Error).message || 'Decryption failed.');
    }
  };

  const runVerification = async (report: SignedCompletionReport) => {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 1. Recalculate canonical digest
      const calculatedDigest = await computeReportDigest(report.payload);
      const digestMatched = calculatedDigest.toLowerCase() === report.integrity.canonicalDigest.toLowerCase();

      if (!digestMatched) {
        errors.push('Digest Mismatch: The payload content has been altered or corrupted.');
      }

      // 2. Verify digital signature
      const signatureVerified = await verifyDigestSignature(
        report.integrity.publicKey,
        calculatedDigest,
        report.integrity.signature
      );

      if (!signatureVerified) {
        errors.push('Digital Signature Invalid: The signature does not correspond to the public key or digest.');
      }

      // 3. If PDF file was also provided, check hash match
      let documentHashMatched: boolean | undefined = undefined;
      if (pdfFile) {
        const pdfBytes = await pdfFile.arrayBuffer();
        const pdfHash = await computeSha256(pdfBytes);
        documentHashMatched = pdfHash.toLowerCase() === report.payload.document.sha256.toLowerCase();
        if (!documentHashMatched) {
          warnings.push('Uploaded PDF SHA-256 does NOT match the document hash referenced in this report.');
        }
      }

      const isValid = errors.length === 0 && digestMatched && signatureVerified;

      setVerificationResult({
        isValid,
        tamperDetected: !digestMatched || !signatureVerified,
        errors,
        warnings,
        digestMatched,
        signatureVerified,
        calculatedDigest,
        declaredDigest: report.integrity.canonicalDigest,
        publicKey: report.integrity.publicKey,
        keyFingerprint: report.integrity.keyFingerprint,
        report,
        documentHashMatched,
      });
    } catch (err) {
      console.error('Verification error:', err);
      setErrorMessage('Verification process encountered an unexpected error.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setPdfFile(file);
    if (verificationResult?.report) {
      // Re-run with the PDF provided
      const pdfBytes = await file.arrayBuffer();
      const pdfHash = await computeSha256(pdfBytes);
      const match = pdfHash.toLowerCase() === verificationResult.report.payload.document.sha256.toLowerCase();
      setVerificationResult({
        ...verificationResult,
        documentHashMatched: match,
      });
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const sec = Math.round(totalSeconds);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h === 0) return `${m}m ${s}s`;
    return `${h}h ${remM}m`;
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider">
          <span>Cryptographic Audit Suite</span>
          <span>•</span>
          <span>Zero-Trust Verification</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 font-serif">
          Verify Report Integrity
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
          Upload any PDFProof completion report (.json or .encrypted) to audit its cryptographic digest, verify its Ed25519 digital signature, and detect any data tampering.
        </p>
      </div>

      {/* Upload Zones: Report + Optional PDF */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Report File Drop */}
        <div
          onClick={() => reportInputRef.current?.click()}
          className="cursor-pointer p-6 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-[#13141b] text-center transition-all group"
        >
          <input
            ref={reportInputRef}
            type="file"
            accept=".json,.encrypted"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleReportFile(e.target.files[0])}
          />
          <div className="mx-auto w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <FileSearch size={18} />
          </div>
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {reportFile ? reportFile.name : 'Upload Report (.json / .encrypted)'}
          </h4>
          <p className="mt-1 text-[11px] text-zinc-400">
            {reportFile ? 'Click to choose different report' : 'Select or drop report file to verify'}
          </p>
        </div>

        {/* Original PDF (Optional) */}
        <div
          onClick={() => pdfInputRef.current?.click()}
          className="cursor-pointer p-6 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-[#13141b] text-center transition-all group"
        >
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
          />
          <div className="mx-auto w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <FileText size={18} />
          </div>
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {pdfFile ? pdfFile.name : 'Optional: Upload Original PDF'}
          </h4>
          <p className="mt-1 text-[11px] text-zinc-400">
            {pdfFile ? 'Click to change PDF' : 'Proves report matches this exact PDF byte-stream'}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <XCircle size={15} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Verification Result Overview Card */}
      {verificationResult && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-lg border ${
              verificationResult.isValid
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-2.5 rounded-full ${
                  verificationResult.isValid
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200'
                    : 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200'
                }`}
              >
                {verificationResult.isValid ? (
                  <ShieldCheck size={24} />
                ) : (
                  <ShieldAlert size={24} />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {verificationResult.isValid
                      ? 'Cryptographic Verification Passed'
                      : 'Cryptographic Tampering Detected'}
                  </h3>
                  <Badge
                    variant={verificationResult.isValid ? 'success' : 'danger'}
                    size="sm"
                    dot
                  >
                    {verificationResult.isValid ? 'Valid' : 'Tampered'}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
                  {verificationResult.isValid
                    ? 'The canonical payload digest exactly matches the calculated SHA-256 hash, and the Ed25519 digital signature was mathematically confirmed using the public key.'
                    : 'The report payload has been modified, corrupted, or the signature failed verification. Do not trust the reading metrics in this report.'}
                </p>
              </div>
            </div>

            {/* Check Breakdown Badges */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded bg-white dark:bg-[#13141b] border border-zinc-200/80 dark:border-zinc-800 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-zinc-400 font-semibold">
                    Canonical Digest
                  </span>
                  {verificationResult.digestMatched ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <XCircle size={13} className="text-rose-500" />
                  )}
                </div>
                <div className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">
                  {verificationResult.digestMatched ? 'Exact Match' : 'Mismatch'}
                </div>
              </div>

              <div className="p-3 rounded bg-white dark:bg-[#13141b] border border-zinc-200/80 dark:border-zinc-800 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-zinc-400 font-semibold">
                    Digital Signature
                  </span>
                  {verificationResult.signatureVerified ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <XCircle size={13} className="text-rose-500" />
                  )}
                </div>
                <div className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">
                  {verificationResult.signatureVerified ? 'Ed25519 Verified' : 'Invalid'}
                </div>
              </div>

              <div className="p-3 rounded bg-white dark:bg-[#13141b] border border-zinc-200/80 dark:border-zinc-800 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-zinc-400 font-semibold">
                    PDF Document Match
                  </span>
                  {verificationResult.documentHashMatched === true ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : verificationResult.documentHashMatched === false ? (
                    <XCircle size={13} className="text-rose-500" />
                  ) : (
                    <span className="text-[10px] text-zinc-400">—</span>
                  )}
                </div>
                <div className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">
                  {verificationResult.documentHashMatched === true
                    ? 'Identical SHA-256'
                    : verificationResult.documentHashMatched === false
                    ? 'Hash Mismatch'
                    : 'No PDF supplied'}
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Trust Disclaimer */}
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <Info size={16} className="text-zinc-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed space-y-1">
              <strong className="text-zinc-900 dark:text-zinc-200">Cryptographic Integrity vs Issuer Trust:</strong>
              <p>
                Verification proves that the report payload has not been tampered with since signing, and that the metrics were generated client-side for the designated document SHA-256. Unless the public key fingerprint is pre-registered with an institutional registry, PDFProof does not attest to the real-world identity of the student or device.
              </p>
            </div>
          </div>

          {/* Verified Document Reading Metrics Summary */}
          {verificationResult.report && (
            <div className="bg-white dark:bg-[#13141b] border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                Verified Document & Reading Dwell Metrics
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900">
                  <span className="text-zinc-400 text-[10px] uppercase block">Active Dwell Time</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {formatDuration(verificationResult.report.payload.metrics.totalActiveSeconds)}
                  </span>
                </div>

                <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900">
                  <span className="text-zinc-400 text-[10px] uppercase block">Completion</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {verificationResult.report.payload.metrics.completionPercentage}%
                  </span>
                </div>

                <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900">
                  <span className="text-zinc-400 text-[10px] uppercase block">Pages Visited</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {verificationResult.report.payload.metrics.pagesVisitedCount} / {verificationResult.report.payload.metrics.totalPages}
                  </span>
                </div>

                <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900">
                  <span className="text-zinc-400 text-[10px] uppercase block">Sessions</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {verificationResult.report.payload.metrics.sessionCount}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs font-mono text-zinc-500 space-y-1">
                <div>Document: {verificationResult.report.payload.document.filename}</div>
                <div className="break-all">
                  SHA-256: {verificationResult.report.payload.document.sha256}
                </div>
                <div>Signer Key: {verificationResult.report.integrity.keyFingerprint}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decrypt Passphrase Modal */}
      <Modal
        isOpen={isDecryptModalOpen}
        onClose={() => setIsDecryptModalOpen(false)}
        title="Encrypted Report Detected"
        description="This report is encrypted using AES-256-GCM. Enter the passphrase chosen during report generation to decrypt and audit it."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Decryption Passphrase
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter passphrase"
              className="w-full text-xs px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDecryptAndVerify();
              }}
            />
          </div>

          {decryptError && (
            <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle size={13} />
              <span>{decryptError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDecryptModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Lock size={13} />}
              onClick={handleDecryptAndVerify}
            >
              Decrypt & Audit Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

