import React from 'react';
import { ReadingSession } from '../../types/tracking';
import { Calendar, Monitor, Clock } from 'lucide-react';

interface TimelineViewProps {
  sessions: ReadingSession[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ sessions }) => {
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

  if (!sessions || sessions.length === 0) {
    return null;
  }

  // Reverse so newest session is first
  const sorted = [...sessions].reverse();

  return (
    <div className="bg-white dark:bg-[#13141b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5">
      <div className="mb-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
          Reading Session History ({sessions.length})
        </h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Auditable chronological record of reading windows and idle detection periods.
        </p>
      </div>

      <div className="space-y-3">
        {sorted.map((s, idx) => (
          <div
            key={s.sessionId || idx}
            className="p-3.5 rounded border border-zinc-100 dark:border-zinc-850/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Session #{sessions.length - idx}
                </span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-500 text-[11px]">
                  {new Date(s.startedAt).toLocaleString()}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>
                  Active: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{formatDuration(s.activeReadingSeconds)}</strong>
                </span>
                <span>•</span>
                <span>
                  Idle: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{formatDuration(s.idleSeconds)}</strong>
                </span>
                <span>•</span>
                <span>
                  Viewport: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{s.viewportWidth}x{s.viewportHeight}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-zinc-400 mr-1">Pages:</span>
              {s.pagesVisited.length === 0 ? (
                <span className="text-[10px] font-mono text-zinc-400">None</span>
              ) : (
                s.pagesVisited.map((p) => (
                  <span
                    key={p}
                    className="px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 font-mono text-[10px] text-zinc-700 dark:text-zinc-300"
                  >
                    p.{p}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

