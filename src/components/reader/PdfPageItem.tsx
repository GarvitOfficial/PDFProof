import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { renderPdfPage } from '../../services/pdfService';

interface PdfPageItemProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onIntersectionChange: (
    pageNumber: number,
    ratio: number,
    boundingRect: DOMRectReadOnly,
    intersectionRect: DOMRectReadOnly
  ) => void;
}

export const PdfPageItem: React.FC<PdfPageItemProps> = ({
  pdfDoc,
  pageNumber,
  scale,
  onIntersectionChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  const [aspectRatio, setAspectRatio] = useState<number>(1.414); // Default A4 ratio
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 848,
  });

  // Observe page intersection
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Build threshold array from 0 to 1 at 0.05 step
    const thresholds = Array.from({ length: 21 }, (_, i) => i * 0.05);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          onIntersectionChange(
            pageNumber,
            entry.intersectionRatio,
            entry.boundingClientRect,
            entry.intersectionRect
          );
        }
      },
      {
        threshold: thresholds,
        rootMargin: '0px',
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [pageNumber, onIntersectionChange]);

  // Render PDF page to canvas
  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        setDimensions({ width: viewport.width, height: viewport.height });
        setAspectRatio(viewport.height / viewport.width);

        if (canvasRef.current) {
          // Cancel any in-flight task
          if (renderTaskRef.current) {
            try {
              renderTaskRef.current.cancel();
            } catch {
              // ignore
            }
          }

          const task = renderPdfPage(page, canvasRef.current, scale);
          renderTaskRef.current = task;
          await task.promise;

          if (!isCancelled) {
            setIsRendered(true);
          }
        }
      } catch (err: unknown) {
        // PDF.js throws 'RenderingCancelledException' when cancelled
        if ((err as { name?: string })?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNumber} render error:`, err);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div
      ref={containerRef}
      data-page-number={pageNumber}
      className="pdf-page-container flex flex-col items-center my-6 group"
      style={{ minHeight: `${dimensions.height}px` }}
    >
      {/* Paper Canvas Card */}
      <div className="relative bg-white shadow-elevated dark:shadow-dark-elevated rounded border border-zinc-200/90 dark:border-zinc-800/90 overflow-hidden">
        <canvas ref={canvasRef} className="pdf-canvas" />

        {/* Page watermark indicator */}
        <div className="absolute bottom-2 right-3 font-mono text-[10px] text-zinc-300 dark:text-zinc-600 select-none pointer-events-none">
          p. {pageNumber}
        </div>
      </div>
    </div>
  );
};
