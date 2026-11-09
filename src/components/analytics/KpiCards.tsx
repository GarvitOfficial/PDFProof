import React from 'react';
import { Clock, BookOpen, Percent, RefreshCw, Layers, Timer } from 'lucide-react';
import { DocumentReadingSummary } from '../../types/tracking';

interface KpiCardsProps {
  summary: DocumentReadingSummary;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ summary }) => {
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

  const kpis = [
    {
      label: 'Active Reading Time',
      value: formatDuration(summary.totalActiveSeconds),
      subtext: 'Cumulative dwell time',
      icon: <Clock size={15} className="text-zinc-500 dark:text-zinc-400" />,
    },
    {
      label: 'Completion',
      value: `${summary.completionPercentage}%`,
      subtext: `${summary.pagesVisitedCount} of ${summary.totalPages} pages visited`,
      icon: <Percent size={15} className="text-emerald-500" />,
    },
    {
      label: 'Average Time / Page',
      value: formatDuration(summary.averageSecondsPerPage),
      subtext: 'Across visited pages',
      icon: <Timer size={15} className="text-zinc-500 dark:text-zinc-400" />,
    },
    {
      label: 'Total Page Visits',
      value: `${summary.totalPageVisits}`,
      subtext: 'Includes revisits',
      icon: <RefreshCw size={15} className="text-zinc-500 dark:text-zinc-400" />,
    },
    {
      label: 'Reading Sessions',
      value: `${summary.sessionCount || 1}`,
      subtext: 'Distinct reading windows',
      icon: <Layers size={15} className="text-zinc-500 dark:text-zinc-400" />,
    },
    {
      label: 'Document Pages',
      value: `${summary.totalPages}`,
      subtext: 'Total page count',
      icon: <BookOpen size={15} className="text-zinc-500 dark:text-zinc-400" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-[#13141b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-3.5 flex flex-col justify-between hover:border-zinc-350 dark:hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              {kpi.label}
            </span>
            {kpi.icon}
          </div>

          <div className="mt-2.5">
            <div className="text-xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
              {kpi.value}
            </div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
              {kpi.subtext}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

