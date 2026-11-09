import React from 'react';
import { useDocuments } from '../../context/DocumentContext';
import { useTracking } from '../../context/TrackingContext';
import { KpiCards } from './KpiCards';
import { HeatmapView } from './HeatmapView';
import { PageTable } from './PageTable';
import { TimelineView } from './TimelineView';
import { ShieldCheck, Info, FileText, ArrowRight } from 'lucide-react';

interface AnalyticsViewProps {
  onNavigateToReader: () => void;
  onNavigateToReports: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  onNavigateToReader,
  onNavigateToReports,
}) => {
  const { currentDoc, currentSummary } = useDocuments();
  const { flushTracking, tracker } = useTracking();

  if (!currentDoc || !currentSummary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-xs text-zinc-500">
          No document selected. Open a PDF from the Library to review analytics.
        </p>
      </div>
    );
  }

  const summary = tracker ? tracker.getSummary() : currentSummary;
  const { meta } = currentDoc;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider">
            <span>Reading Analytics</span>
            <span>•</span>
            <span>Page Visibility & Dwell Telemetry</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 font-serif">
            {meta.filename}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>SHA-256: {meta.fingerprintSha256.substring(0, 24)}...</span>
            <span>•</span>
            <span>{meta.totalPages} pages</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToReader}
            className="text-xs font-medium px-3 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 transition-colors"
          >
            Continue Reading
          </button>
          <button
            onClick={async () => {
              await flushTracking();
              onNavigateToReports();
            }}
            className="text-xs font-medium px-3.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors shadow-subtle inline-flex items-center gap-1.5"
          >
            <span>Generate Report</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Engagement Honesty Disclaimer */}
      <div className="p-3.5 rounded-lg bg-zinc-100/70 dark:bg-[#13141b] border border-zinc-200/80 dark:border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-600 dark:text-zinc-400">
        <Info size={16} className="text-zinc-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Methodology Disclosure:</strong> Active reading time is measured via viewport intersection ratios, browser foreground visibility state, and user interaction thresholds. It represents verified display engagement rather than neurological cognition or comprehension.
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards summary={summary} />

      {/* Engagement Heatmap */}
      <HeatmapView
        totalPages={meta.totalPages}
        pageMetrics={summary.pageMetrics}
        onSelectPage={() => onNavigateToReader()}
      />

      {/* Page-by-Page Granular Table */}
      <PageTable
        totalPages={meta.totalPages}
        pageMetrics={summary.pageMetrics}
      />

      {/* Timeline of Reading Sessions */}
      <TimelineView sessions={summary.sessions} />
    </div>
  );
};

