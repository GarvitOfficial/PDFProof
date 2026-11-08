import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { generateThumbnailUrl } from '../../services/pdfService';
import { PageReadingMetrics } from '../../types/tracking';

interface ThumbnailSidebarProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  totalPages: number;
  currentPage: number;
  pageMetrics: Record<number, PageReadingMetrics>;
  onSelectPage: (page: number) => void;
  isOpen: boolean;
}

export const ThumbnailSidebar: React.FC<ThumbnailSidebarProps> = ({
  pdfDoc,
  totalPages,
  currentPage,
  pageMetrics,
  onSelectPage,
  isOpen,
}) => {
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!pdfDoc || !isOpen) return;

    let isCancelled = false;

    // Lazily render thumbnails for visible pages
    const renderThumbnails = async () => {
      for (let i = 1; i <= Math.min(totalPages, 50); i++) {
        if (isCancelled) break;
        if (!thumbnails[i]) {
          try {
            const url = await generateThumbnailUrl(pdfDoc, i, 110);
            if (!isCancelled) {
              setThumbnails((prev) => ({ ...prev, [i]: url }));
            }
          } catch (err) {
            console.warn(`Failed thumbnail for page ${i}`, err);
          }
        }
      }
    };

    renderThumbnails();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, totalPages, isOpen]);

  if (!isOpen) return null;

  return (
    <aside className="w-44 bg-zinc-50 dark:bg-[#0f1016] border-r border-zinc-200 dark:border-zinc-800/80 overflow-y-auto p-3 flex flex-col gap-3 shrink-0 select-none">
      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold px-1">
        Pages ({totalPages})
      </div>

      <div className="space-y-3">
        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
          const isActive = currentPage === pageNum;
          const metric = pageMetrics[pageNum];
          const isVisited = metric && (metric.visitCount > 0 || metric.activeSeconds > 0);
          const thumbUrl = thumbnails[pageNum];

          return (
            <div
              key={pageNum}
              onClick={() => onSelectPage(pageNum)}
              className={`group cursor-pointer rounded p-1.5 transition-all text-center ${
                isActive
                  ? 'bg-zinc-200/80 dark:bg-zinc-800 ring-1 ring-zinc-400 dark:ring-zinc-600'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-850/60'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="w-full aspect-[1/1.4] bg-white rounded border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex items-center justify-center relative">
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={`Page ${pageNum}`}
                    className="w-full h-full object-contain pointer-events-none"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-[10px] font-mono text-zinc-400">p.{pageNum}</span>
                )}

                {/* Visit status dot */}
                {isVisited && (
                  <span
                    className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-sm"
                    title={`Visited • ${Math.round(metric.activeSeconds)}s`}
                  />
                )}
              </div>

              {/* Page Number & Time */}
              <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono px-1">
                <span
                  className={
                    isActive
                      ? 'font-bold text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }
                >
                  {pageNum}
                </span>
                {metric && metric.activeSeconds > 0 && (
                  <span className="text-zinc-400">
                    {Math.round(metric.activeSeconds)}s
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
