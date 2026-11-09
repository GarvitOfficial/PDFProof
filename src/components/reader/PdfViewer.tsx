import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useDocuments } from '../../context/DocumentContext';
import { useTracking } from '../../context/TrackingContext';
import { useSettings } from '../../context/SettingsContext';
import { loadPdf } from '../../services/pdfService';
import { ViewerToolbar } from './ViewerToolbar';
import { ThumbnailSidebar } from './ThumbnailSidebar';
import { SearchBar } from './SearchBar';
import { PdfPageItem } from './PdfPageItem';
import { AlertCircle, Loader2 } from 'lucide-react';

export const PdfViewer: React.FC = () => {
  const { currentDoc } = useDocuments();
  const {
    updatePageVisibility,
    updatePageIntersection,
    setExplicitPage,
    currentPageNumber,
    pageMetrics,
  } = useTracking();
  const { settings } = useSettings();

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [scale, setScale] = useState<number>(1.15);
  const [viewMode, setViewMode] = useState<'continuous' | 'single'>(settings.readerViewMode);
  const [singlePageNumber, setSinglePageNumber] = useState<number>(currentPageNumber || 1);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Load PDF document proxy
  useEffect(() => {
    if (!currentDoc?.pdfBytes) return;

    let isCancelled = false;
    setIsLoadingPdf(true);
    setPdfError(null);

    loadPdf(currentDoc.pdfBytes)
      .then((doc) => {
        if (!isCancelled) {
          setPdfDoc(doc);
          setIsLoadingPdf(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load PDF document:', err);
          setPdfError('Failed to parse and render PDF. The document may be corrupted or encrypted.');
          setIsLoadingPdf(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentDoc?.meta.id, currentDoc?.pdfBytes]);

  // Fit to width calculator
  const handleFitWidth = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const containerWidth = scrollContainerRef.current.clientWidth - 80;
    const targetScale = Math.min(2.0, Math.max(0.6, containerWidth / 595));
    setScale(parseFloat(targetScale.toFixed(2)));
  }, []);

  const totalPages = currentDoc?.meta.totalPages || 1;

  // Page navigation handler for both single and continuous modes
  const handlePageChange = useCallback(
    (pageNumber: number) => {
      const validPage = Math.max(1, Math.min(totalPages, pageNumber));

      if (viewMode === 'single') {
        setSinglePageNumber(validPage);
        setExplicitPage(validPage);
        return;
      }

      // Continuous mode: scroll element into view
      const targetEl = document.querySelector(`[data-page-number="${validPage}"]`);
      if (targetEl && scrollContainerRef.current) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [viewMode, totalPages, setExplicitPage]
  );

  // Switch view mode handler
  const handleToggleViewMode = () => {
    const nextMode = viewMode === 'continuous' ? 'single' : 'continuous';
    setViewMode(nextMode);

    if (nextMode === 'single') {
      const p = currentPageNumber || 1;
      setSinglePageNumber(p);
      setExplicitPage(p);
    }
  };

  // Continuous mode scroll watcher: calculates exact visibility & scroll depth on each page
  useEffect(() => {
    if (viewMode !== 'continuous' || !pdfDoc) return;
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let ticking = false;

    const checkVisibility = () => {
      ticking = false;
      const containerRect = scrollContainer.getBoundingClientRect();
      const pageElements = scrollContainer.querySelectorAll<HTMLElement>(
        '.pdf-page-container[data-page-number]'
      );

      pageElements.forEach((el) => {
        const pNum = parseInt(el.dataset.pageNumber || '1', 10);
        const pageRect = el.getBoundingClientRect();

        // Calculate vertical intersection between pageRect and containerRect
        const visibleTop = Math.max(containerRect.top, pageRect.top);
        const visibleBottom = Math.min(containerRect.bottom, pageRect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibleRatio = pageRect.height > 0 ? visibleHeight / pageRect.height : 0;

        // Calculate scroll depth (how far down this page has been scrolled through)
        const scrolledPastTop = Math.max(0, containerRect.top - pageRect.top);
        const totalTraversed = scrolledPastTop + visibleHeight;
        const depthPct =
          pageRect.height > 0
            ? Math.min(100, Math.max(0, Math.round((totalTraversed / pageRect.height) * 100)))
            : 0;

        updatePageVisibility(pNum, visibleRatio, depthPct);
      });
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(checkVisibility);
        ticking = true;
      }
    };

    // Initial evaluation
    const timer = setTimeout(checkVisibility, 100);

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [pdfDoc, viewMode, updatePageVisibility]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const activePage = viewMode === 'single' ? singlePageNumber : currentPageNumber;

      if (e.key === 'j' || e.key === 'ArrowRight') {
        if (activePage < totalPages) {
          handlePageChange(activePage + 1);
        }
      } else if (e.key === 'k' || e.key === 'ArrowLeft') {
        if (activePage > 1) {
          handlePageChange(activePage - 1);
        }
      } else if (e.key === '/' || (e.metaKey && e.key === 'f')) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, currentPageNumber, singlePageNumber, viewMode, handlePageChange]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (!currentDoc) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-zinc-500">
        No document selected. Open a file from the Library.
      </div>
    );
  }

  const activePageDisplay = viewMode === 'single' ? singlePageNumber : currentPageNumber;

  return (
    <div
      ref={viewerContainerRef}
      className="flex-1 flex flex-col h-full bg-[#f6f5f1] dark:bg-[#0c0d12] overflow-hidden relative"
    >
      {/* Reader Toolbar */}
      <ViewerToolbar
        currentPage={activePageDisplay}
        totalPages={totalPages}
        scale={scale}
        viewMode={viewMode}
        isSidebarOpen={isSidebarOpen}
        isSearchOpen={isSearchOpen}
        isFullscreen={isFullscreen}
        onPageChange={handlePageChange}
        onZoomIn={() => setScale((s) => Math.min(2.5, parseFloat((s + 0.15).toFixed(2))))}
        onZoomOut={() => setScale((s) => Math.max(0.6, parseFloat((s - 0.15).toFixed(2))))}
        onResetZoom={(level) => setScale(level)}
        onFitWidth={handleFitWidth}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
        onToggleViewMode={handleToggleViewMode}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* In-Document Search Bar */}
      <SearchBar
        pdfDoc={pdfDoc}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onJumpToPage={handlePageChange}
      />

      {/* Main Reading Canvas & Sidebar Split */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Thumbnails Sidebar */}
        <ThumbnailSidebar
          pdfDoc={pdfDoc}
          totalPages={totalPages}
          currentPage={activePageDisplay}
          pageMetrics={pageMetrics}
          onSelectPage={handlePageChange}
          isOpen={isSidebarOpen}
        />

        {/* Scrollable Document Body */}
        <main
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center custom-scrollbar focus:outline-none"
          tabIndex={0}
        >
          {isLoadingPdf && (
            <div className="flex flex-col items-center justify-center p-16 gap-3 text-zinc-500">
              <Loader2 size={24} className="animate-spin text-zinc-400" />
              <span className="text-xs font-mono">Rendering document...</span>
            </div>
          )}

          {pdfError && (
            <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 max-w-md flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Unable to Render PDF</h4>
                <p className="mt-1">{pdfError}</p>
              </div>
            </div>
          )}

          {!isLoadingPdf && pdfDoc && (
            <div className="w-full flex flex-col items-center">
              {viewMode === 'continuous' ? (
                // Continuous vertical scroll mode
                Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <PdfPageItem
                    key={pageNum}
                    pdfDoc={pdfDoc}
                    pageNumber={pageNum}
                    scale={scale}
                    onIntersectionChange={updatePageIntersection}
                  />
                ))
              ) : (
                // Single page mode
                <PdfPageItem
                  key={singlePageNumber}
                  pdfDoc={pdfDoc}
                  pageNumber={singlePageNumber}
                  scale={scale}
                  onIntersectionChange={updatePageIntersection}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
