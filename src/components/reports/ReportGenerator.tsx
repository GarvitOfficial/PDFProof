import React, { useState, useEffect } from 'react';
import { useDocuments } from '../../context/DocumentContext';
import { useSettings } from '../../context/SettingsContext';
import { useTracking } from '../../context/TrackingContext';
import {
  computeReportDigest,
  encryptReportData,
  importPrivateKey,
  signDigest,
} from '../../services/crypto';
import { generateReportPdf } from '../../services/reportPdf';
import { storeReport } from '../../services/storage';
import { ReportPayload, SignedCompletionReport } from '../../types/report';
import { PageReadingMetrics } from '../../types/tracking';
import { ReportPreview } from './ReportPreview';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import {
  FileDown,
  Lock,
  Code,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const ReportGenerator: React.FC = () => {
  const { currentDoc, currentSummary } = useDocuments();
  const { keyRecord, settings, updateSettings } = useSettings();
  const { tracker } = useTracking();

  const [assignmentId, setAssignmentId] = useState('');
  const [readerIdentifier, setReaderIdentifier] = useState(settings.readerIdentifier || '');
  const [notes, setNotes] = useState('');

  const [signedReport, setSignedReport] = useState<SignedCompletionReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Encryption modal state
  const [isEncryptModalOpen, setIsEncryptModalOpen] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [encryptError, setEncryptError] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  useEffect(() => {
    if (settings.readerIdentifier) {
      setReaderIdentifier(settings.readerIdentifier);
    }
  }, [settings.readerIdentifier]);

  if (!currentDoc || !currentSummary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-zinc-500">
        No document selected. Open a document from the Library to generate a completion report.
      </div>
    );
  }

  const handleGenerateReport = async () => {
    if (!keyRecord) return;
    setIsGenerating(true);

    try {
      const nowIso = new Date().toISOString();
      const reportId = crypto.randomUUID ? crypto.randomUUID() : `rep_${Date.now()}`;

      // Save reader identifier preference if entered
      if (readerIdentifier && readerIdentifier !== settings.readerIdentifier) {
        updateSettings({ readerIdentifier });
      }

      const activeSummary = tracker ? tracker.getSummary() : currentSummary;

      const pageMetricsArray: PageReadingMetrics[] = (
        Object.values(activeSummary.pageMetrics) as PageReadingMetrics[]
      ).sort((a, b) => a.pageNumber - b.pageNumber);

      const payload: ReportPayload = {
        reportId,
        schemaVersion: '1.0.0',
        generatedAt: nowIso,
        document: {
          filename: currentDoc.meta.filename,
          fileSize: currentDoc.meta.fileSize,
          sha256: currentDoc.meta.fingerprintSha256,
          totalPages: currentDoc.meta.totalPages,
          title: currentDoc.meta.title,
        },
        context: {
          assignmentId: assignmentId.trim() || undefined,
          readerIdentifier: readerIdentifier.trim() || undefined,
          expectedFingerprint: currentDoc.meta.expectedFingerprint,
          fingerprintMatched: currentDoc.meta.isFingerprintMatch ?? undefined,
          notes: notes.trim() || undefined,
        },
        metrics: {
          totalActiveSeconds: activeSummary.totalActiveSeconds,
          pagesVisitedCount: activeSummary.pagesVisitedCount,
          totalPages: activeSummary.totalPages,
          completionPercentage: activeSummary.completionPercentage,
          totalPageVisits: activeSummary.totalPageVisits,
          sessionCount: activeSummary.sessionCount || 1,
          averageSecondsPerPage: activeSummary.averageSecondsPerPage,
        },
        pageMetrics: pageMetricsArray,
        sessions: activeSummary.sessions,
        methodology: {
          activeTracking: 'IntersectionObserver + Page Visibility API + Inactivity Detector',
          timeEstimationNotice:
            'Active time measures browser viewport visibility and user interaction events. It reflects estimated reading engagement, not neurological attention.',
          privacyGuarantee: '100% Client-Side Evaluation. Zero server telemetry or cloud persistence.',
        },
      };

      // Compute invariant canonical digest
      const canonicalDigest = await computeReportDigest(payload);

      // Sign canonical digest with Ed25519 private key
      const privateKey = await importPrivateKey(keyRecord.privateKeyBase64);
      const signature = await signDigest(privateKey, canonicalDigest);

      const fullReport: SignedCompletionReport = {
        payload,
        integrity: {
          digestAlgorithm: 'SHA-256',
          canonicalDigest,
          signatureAlgorithm: 'Ed25519',
          signature,
          publicKey: keyRecord.publicKeyBase64,
          keyFingerprint: keyRecord.keyFingerprint,
        },
      };

      await storeReport(fullReport);
      setSignedReport(fullReport);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!signedReport) return;
    setIsExportingPdf(true);
    try {
      const pdfBytes = await generateReportPdf(signedReport);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `completion-report-${signedReport.payload.reportId.substring(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadJson = () => {
    if (!signedReport) return;
    const jsonStr = JSON.stringify(signedReport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `completion-report-${signedReport.payload.reportId.substring(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadEncrypted = async () => {
    if (!signedReport) return;
    if (!passphrase || passphrase.length < 6) {
      setEncryptError('Passphrase must be at least 6 characters.');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setEncryptError('Passphrases do not match.');
      return;
    }

    setEncryptError(null);
    setIsEncrypting(true);

    try {
      const jsonStr = JSON.stringify(signedReport);
      const encryptedContainer = await encryptReportData(
        jsonStr,
        passphrase,
        signedReport.payload.reportId,
        signedReport.payload.document.sha256
      );

      const blob = new Blob([JSON.stringify(encryptedContainer, null, 2)], {
        type: 'application/octet-stream',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `completion-report-${signedReport.payload.reportId.substring(0, 8)}.encrypted`;
      a.click();
      URL.revokeObjectURL(url);

      setIsEncryptModalOpen(false);
      setPassphrase('');
      setConfirmPassphrase('');
    } catch (err) {
      console.error('Encryption failure:', err);
      setEncryptError('Encryption failed. Check your passphrase.');
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider">
          <span>Attestation Engine</span>
          <span>•</span>
          <span>Ed25519 Cryptographic Signatures</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 font-serif">
          Generate Completion Report
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
          Produce a tamper-evident reading certificate certifying active dwell time against the original PDF SHA-256 fingerprint.
        </p>
      </div>

      {/* Report Options Form */}
      <div className="bg-white dark:bg-[#13141b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
          Optional Context Metadata
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Reader Identifier / Pseudonym
            </label>
            <input
              type="text"
              value={readerIdentifier}
              onChange={(e) => setReaderIdentifier(e.target.value)}
              placeholder="e.g. Student #4819 or researcher pseudonym"
              className="w-full text-xs px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Assignment / Course ID
            </label>
            <input
              type="text"
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
              placeholder="e.g. CS-401 or Regulatory Audit Q3"
              className="w-full text-xs px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Notes / Attestation Remarks
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Reviewed all statistical methodology sections"
            className="w-full text-xs px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div className="text-[11px] font-mono text-zinc-400">
            Signer Key: {keyRecord?.keyFingerprint.substring(0, 16)}...
          </div>

          <Button
            variant="primary"
            size="md"
            icon={<Sparkles size={14} />}
            isLoading={isGenerating}
            onClick={handleGenerateReport}
          >
            Sign & Generate Certificate
          </Button>
        </div>
      </div>

      {/* Generated Report Card & Exports */}
      {signedReport && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Certified Report Preview
            </h3>

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Code size={13} />}
                onClick={handleDownloadJson}
              >
                Export JSON
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={<Lock size={13} />}
                onClick={() => setIsEncryptModalOpen(true)}
              >
                Encrypt (.encrypted)
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={<FileDown size={13} />}
                isLoading={isExportingPdf}
                onClick={handleDownloadPdf}
              >
                Export PDF
              </Button>
            </div>
          </div>

          <ReportPreview report={signedReport} />
        </section>
      )}

      {/* Passphrase Encryption Modal */}
      <Modal
        isOpen={isEncryptModalOpen}
        onClose={() => setIsEncryptModalOpen(false)}
        title="Encrypt Report with AES-256-GCM"
        description="Derive a 256-bit encryption key using PBKDF2 (100,000 rounds) from your passphrase. The encrypted container can only be opened with this passphrase."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Passphrase
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full text-xs px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Confirm Passphrase
            </label>
            <input
              type="password"
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              placeholder="Repeat passphrase"
              className="w-full text-xs px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {encryptError && (
            <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertCircle size={13} />
              <span>{encryptError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEncryptModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Lock size={13} />}
              isLoading={isEncrypting}
              onClick={handleDownloadEncrypted}
            >
              Encrypt & Download (.encrypted)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

