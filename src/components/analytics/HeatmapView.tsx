import React, { useState } from 'react';
import { PageReadingMetrics } from '../../types/tracking';

interface HeatmapViewProps {
  totalPages: number;
  pageMetrics: Record<number, PageReadingMetrics>;
  onSelectPage?: (page: number) => void;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  totalPages,
  pageMetrics,
  onSelectPage,
}) => {
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);

  // Find max active time for scaling
  let maxTime = 1;
  Object.values(pageMetrics).forEach((m) => {
    if (m.activeSeconds > maxTime) maxTime = m.activeSeconds;
  });

  const formatDuration = (totalSeconds: number) => {
    const sec = Math.round(totalSeconds);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const getHeatColorClass = (seconds: number) => {
    if (seconds <= 0) {
      return 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 border-zinc-200/80 dark:border-zinc-800/80';
    }
    const ratio = seconds / maxTime;
    if (ratio < 0.25) {
      return 'bg-zinc-200 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-200 border-zinc-300 dark:border-zinc-650';
    }
    if (ratio < 0.6) {
      return 'bg-zinc-400 dark:bg-zinc-600 text-zinc-900 dark:text-white border-zinc-500 dark:border-zinc-500 font-semibold';
    }
    if (ratio < 0.85) {
      return 'bg-zinc-700 dark:bg-zinc-400 text-white dark:text-zinc-950 border-zinc-800 dark:border-zinc-300 font-bold';
    }
    return 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-black dark:border-white font-bold';
  };

  return (
    <div className="bg-white dark:bg-[#13141b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
            Page Engagement Heatmap
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Dwell time intensity across all {totalPages} document pages.
          </p>
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
          <span>0s</span>
          <span className="w-3.5 h-3.5 rounded-sm bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80" />
          <span className="w-3.5 h-3.5 rounded-sm bg-zinc-200 dark:bg-zinc-700/60 border border-zinc-300 dark:border-zinc-600" />
          <span className="w-3.5 h-3.5 rounded-sm bg-zinc-400 dark:bg-zinc-600 border border-zinc-500" />
          <span className="w-3.5 h-3.5 rounded-sm bg-zinc-700 dark:bg-zinc-400 border border-zinc-800" />
          <span className="w-3.5 h-3.5 rounded-sm bg-zinc-900 dark:bg-zinc-100 border border-black dark:border-white" />
          <span>{formatDuration(maxTime)}</span>
        </div>
      </div>

      {/* Grid of Pages */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
          const metric = pageMetrics[pageNum] || {
            pageNumber: pageNum,
            activeSeconds: 0,
            visitCount: 0,
            maxScrollDepth: 0,
            firstVisit: null,
            lastVisit: null,
          };

          const isHovered = hoveredPage === pageNum;

          return (
            <div
              key={pageNum}
              onMouseEnter={() => setHoveredPage(pageNum)}
              onMouseLeave={() => setHoveredPage(null)}
              onClick={() => onSelectPage?.(pageNum)}
              className={`relative cursor-pointer aspect-square rounded p-1.5 flex flex-col justify-between border transition-all ${getHeatColorClass(
                metric.activeSeconds
              )} ${isHovered ? 'ring-2 ring-zinc-500 scale-105 z-10' : ''}`}
            >
              <div className="text-[10px] font-mono leading-none">p.{pageNum}</div>
              <div className="text-[10px] font-mono text-right leading-none">
                {metric.activeSeconds > 0 ? formatDuration(metric.activeSeconds) : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover Details Banner */}
      {hoveredPage !== null && (
        <div className="mt-4 p-3 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex flex-wrap items-center justify-between gap-4">
          <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
            Page {hoveredPage}
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <span>
              Time:{' '}
              <strong className="text-zinc-900 dark:text-zinc-100">
                {formatDuration(pageMetrics[hoveredPage]?.activeSeconds || 0)}
              </strong>
            </span>
            <span>
              Visits:{' '}
              <strong className="text-zinc-900 dark:text-zinc-100">
                {pageMetrics[hoveredPage]?.visitCount || 0}
              </strong>
            </span>
            <span>
              Scroll Depth:{' '}
              <strong className="text-zinc-900 dark:text-zinc-100">
                {pageMetrics[hoveredPage]?.maxScrollDepth || 0}%
              </strong>
            </span>
            <span>
              First Visit:{' '}
              {pageMetrics[hoveredPage]?.firstVisit
                ? new Date(pageMetrics[hoveredPage].firstVisit!).toLocaleTimeString()
                : 'Never'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
