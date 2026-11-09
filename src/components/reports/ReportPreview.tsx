import React from 'react';
import { SignedCompletionReport } from '../../types/report';
import { ShieldCheck, FileText, CheckCircle2, AlertTriangle, Key } from 'lucide-react';

interface ReportPreviewProps {
  report: SignedCompletionReport;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ report }) => {
  const { payload, integrity } = report;

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
    <div className="bg-white dark:bg-[#12131b] border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 space-y-6 shadow-elevated dark:shadow-dark-elevated">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Signed Reading Completion Certificate
            </span>
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-serif mt-1">
            {payload.document.filename}
          </h2>
          <div className="mt-1 text-xs font-mono text-zinc-400">
            Report ID: {payload.reportId}
          </div>
        </div>

        <div className="text-right font-mono text-xs text-zinc-500">
          <div>Generated at:</div>
          <div className="text-zinc-800 dark:text-zinc-200 font-medium">
            {new Date(payload.generatedAt).toUTCString()}
          </div>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 text-xs font-mono">
        <div>
          <span className="text-zinc-400 uppercase text-[10px] block">Document SHA-256</span>
          <span className="text-zinc-800 dark:text-zinc-200 break-all text-[11px]">
            {payload.document.sha256}
          </span>
        </div>

        {payload.context.readerIdentifier && (
          <div>
            <span className="text-zinc-400 uppercase text-[10px] block">Reader Identifier</span>
            <span className="text-zinc-800 dark:text-zinc-200">
              {payload.context.readerIdentifier}
            </span>
          </div>
        )}

        {payload.context.assignmentId && (
          <div>
            <span className="text-zinc-400 uppercase text-[10px] block">Assignment ID</span>
            <span className="text-zinc-800 dark:text-zinc-200">
              {payload.context.assignmentId}
            </span>
          </div>
        )}

        {payload.context.expectedFingerprint && (
          <div>
            <span className="text-zinc-400 uppercase text-[10px] block">Expected Hash Status</span>
            <span
              className={
                payload.context.fingerprintMatched
                  ? 'text-emerald-600 font-semibold'
                  : 'text-amber-600 font-semibold'
              }
            >
              {payload.context.fingerprintMatched ? 'MATCHED' : 'MISMATCH'}
            </span>
          </div>
        )}
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-[10px] font-mono text-zinc-400 uppercase">Active Time</div>
          <div className="text-base font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {formatDuration(payload.metrics.totalActiveSeconds)}
          </div>
        </div>
        <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-[10px] font-mono text-zinc-400 uppercase">Completion</div>
          <div className="text-base font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {payload.metrics.completionPercentage}%
          </div>
        </div>
        <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-[10px] font-mono text-zinc-400 uppercase">Pages Visited</div>
          <div className="text-base font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {payload.metrics.pagesVisitedCount} / {payload.metrics.totalPages}
          </div>
        </div>
        <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-[10px] font-mono text-zinc-400 uppercase">Sessions</div>
          <div className="text-base font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {payload.metrics.sessionCount}
          </div>
        </div>
      </div>

      {/* Cryptographic Signature Box */}
      <div className="p-4 rounded-lg bg-zinc-900 text-zinc-100 dark:bg-zinc-950 border border-zinc-800 space-y-2.5 font-mono text-xs">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
            <Key size={13} className="text-emerald-400" />
            <span>CRYPTOGRAPHIC INTEGRITY DIGEST & SIGNATURE</span>
          </div>
          <span>Algorithm: {integrity.signatureAlgorithm}</span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-500 uppercase block">Canonical Digest (SHA-256)</span>
          <span className="text-[11px] text-zinc-300 break-all">{integrity.canonicalDigest}</span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-500 uppercase block">Digital Signature</span>
          <span className="text-[11px] text-zinc-400 break-all">{integrity.signature}</span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-500 uppercase block">Signer Public Key Fingerprint</span>
          <span className="text-[11px] text-zinc-400 break-all">{integrity.keyFingerprint}</span>
        </div>
      </div>
    </div>
  );
};

