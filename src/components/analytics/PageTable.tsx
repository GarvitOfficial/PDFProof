import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { PageReadingMetrics } from '../../types/tracking';

interface PageTableProps {
  pageMetrics: Record<number, PageReadingMetrics>;
  totalPages: number;
}

type SortField = 'pageNumber' | 'activeSeconds' | 'visitCount' | 'maxScrollDepth' | 'firstVisit' | 'lastVisit';
type SortDirection = 'asc' | 'desc';

export const PageTable: React.FC<PageTableProps> = ({ pageMetrics, totalPages }) => {
  const [sortField, setSortField] = useState<SortField>('pageNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterVisitedOnly, setFilterVisitedOnly] = useState<boolean>(false);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Build rows array
  const rows: PageReadingMetrics[] = [];
  for (let i = 1; i <= totalPages; i++) {
    const metric = pageMetrics[i] || {
      pageNumber: i,
      activeSeconds: 0,
      visitCount: 0,
      maxScrollDepth: 0,
      firstVisit: null,
      lastVisit: null,
    };
    if (!filterVisitedOnly || metric.visitCount > 0 || metric.activeSeconds > 0) {
      rows.push(metric);
    }
  }

  // Sort rows
  rows.sort((a, b) => {
    let comparison = 0;
    if (sortField === 'pageNumber') comparison = a.pageNumber - b.pageNumber;
    else if (sortField === 'activeSeconds') comparison = a.activeSeconds - b.activeSeconds;
    else if (sortField === 'visitCount') comparison = a.visitCount - b.visitCount;
    else if (sortField === 'maxScrollDepth') comparison = a.maxScrollDepth - b.maxScrollDepth;
    else if (sortField === 'firstVisit') {
      comparison = (a.firstVisit ? new Date(a.firstVisit).getTime() : 0) -
                   (b.firstVisit ? new Date(b.firstVisit).getTime() : 0);
    } else if (sortField === 'lastVisit') {
      comparison = (a.lastVisit ? new Date(a.lastVisit).getTime() : 0) -
                   (b.lastVisit ? new Date(b.lastVisit).getTime() : 0);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="opacity-40" />;
    }
    return sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  return (
    <div className="bg-white dark:bg-[#13141b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg overflow-hidden">
      {/* Table Toolbar */}
      <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
            Page-Level Engagement Table
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Granular active dwell time and maximum scroll depth per document page.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-zinc-600 dark:text-zinc-400 select-none">
            <input
              type="checkbox"
              checked={filterVisitedOnly}
              onChange={(e) => setFilterVisitedOnly(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-0"
            />
            <span>Visited only</span>
          </label>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-850/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-500 uppercase">
            <tr>
              <th
                onClick={() => handleSort('pageNumber')}
                className="py-2.5 px-4 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <div className="flex items-center gap-1.5">
                  <span>Page</span>
                  {renderSortIcon('pageNumber')}
                </div>
              </th>
              <th
                onClick={() => handleSort('activeSeconds')}
                className="py-2.5 px-4 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <div className="flex items-center gap-1.5">
                  <span>Active Reading Time</span>
                  {renderSortIcon('activeSeconds')}
                </div>
              </th>
              <th
                onClick={() => handleSort('visitCount')}
                className="py-2.5 px-4 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <div className="flex items-center gap-1.5">
                  <span>Visits</span>
                  {renderSortIcon('visitCount')}
                </div>
              </th>
              <th
                onClick={() => handleSort('maxScrollDepth')}
                className="py-2.5 px-4 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <div className="flex items-center gap-1.5">
                  <span>Max Scroll Depth</span>
                  {renderSortIcon('maxScrollDepth')}
                </div>
              </th>
              <th
                onClick={() => handleSort('firstVisit')}
                className="py-2.5 px-4 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <div className="flex items-center gap-1.5">
                  <span>First Visit</span>
                  {renderSortIcon('firstVisit')}
                </div>
              </th>
              <th
                onClick={() => handleSort('lastVisit')}
                className="py-2.5 px-4 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <div className="flex items-center gap-1.5">
                  <span>Last Visit</span>
                  {renderSortIcon('lastVisit')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-mono-num">
            {rows.map((row) => {
              const isVisited = row.visitCount > 0 || row.activeSeconds > 0;
              return (
                <tr
                  key={row.pageNumber}
                  className={`hover:bg-zinc-50 dark:hover:bg-zinc-850/40 transition-colors ${
                    !isVisited ? 'opacity-40' : ''
                  }`}
                >
                  <td className="py-2.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                    Page {row.pageNumber}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                    {formatDuration(row.activeSeconds)}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-zinc-700 dark:text-zinc-300">
                    {row.visitCount}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0">
                        <div
                          className="h-full bg-zinc-800 dark:bg-zinc-200 rounded-full"
                          style={{ width: `${row.maxScrollDepth}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        {row.maxScrollDepth}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-[11px] text-zinc-500 font-mono">
                    {row.firstVisit ? new Date(row.firstVisit).toLocaleTimeString() : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-[11px] text-zinc-500 font-mono">
                    {row.lastVisit ? new Date(row.lastVisit).toLocaleTimeString() : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

