import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Trash2,
  BookOpen,
  BarChart2,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { DocumentMeta } from '../../types/document';
import { DocumentReadingSummary } from '../../types/tracking';
import { Badge } from '../common/Badge';

interface DocumentCardProps {
  meta: DocumentMeta;
  summary?: DocumentReadingSummary;
  onOpen: () => void;
  onViewAnalytics: () => void;
  onDelete: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  meta,
  summary,
  onOpen,
  onViewAnalytics,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);

  const copyFingerprint = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(meta.fingerprintSha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never read';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
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

  const completionPct = summary?.completionPercentage || 0;
  const activeTime = summary?.totalActiveSeconds || 0;

  return (
    <div className="bg-white dark:bg-[#13141b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-4 hover:border-zinc-350 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
      <div>
        {/* Top Header: Filename & Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <h4
                className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate cursor-pointer hover:underline"
                title={meta.filename}
                onClick={onOpen}
              >
                {meta.filename}
              </h4>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>{meta.totalPages} pages</span>
                <span>•</span>
                <span>{formatFileSize(meta.fileSize)}</span>
                <span>•</span>
                <span>{formatTimeAgo(meta.lastReadAt)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onDelete}
            className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            title="Delete document and local reading records"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* SHA-256 Fingerprint Pill */}
        <div className="mt-3.5 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-[#181922] border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] uppercase font-mono font-semibold text-zinc-400 dark:text-zinc-500 shrink-0">
              SHA-256
            </span>
            <span
              className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 truncate"
              title={meta.fingerprintSha256}
            >
              {meta.fingerprintSha256.substring(0, 16)}...{meta.fingerprintSha256.substring(56)}
            </span>
          </div>
          <button
            onClick={copyFingerprint}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded transition-colors shrink-0"
            title="Copy full SHA-256"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          </button>
        </div>

        {/* Expected Hash Match Status (if provided) */}
        {meta.expectedFingerprint && (
          <div className="mt-2">
            {meta.isFingerprintMatch ? (
              <Badge variant="success" size="sm" dot>
                Matches Expected Hash
              </Badge>
            ) : (
              <Badge variant="danger" size="sm" dot>
                Hash Mismatch with Expected Hash
              </Badge>
            )}
          </div>
        )}

        {/* Progress & Time Stats */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-500 dark:text-zinc-400">
              Read: {summary?.pagesVisitedCount || 0} / {meta.totalPages} pages ({completionPct}%)
            </span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {formatDuration(activeTime)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-800 dark:bg-zinc-200 rounded-full transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-850/60 flex items-center justify-between gap-2">
        <button
          onClick={onViewAnalytics}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <BarChart2 size={13} />
          <span>Analytics</span>
        </button>

        <button
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors shadow-subtle"
        >
          <BookOpen size={13} />
          <span>Read Document</span>
        </button>
      </div>
    </div>
  );
};

