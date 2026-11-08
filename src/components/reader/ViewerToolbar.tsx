import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sidebar,
  Search,
  Columns,
  Square,
  RotateCw,
} from 'lucide-react';

interface ViewerToolbarProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  viewMode: 'continuous' | 'single';
  isSidebarOpen: boolean;
  isSearchOpen: boolean;
  isFullscreen: boolean;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: (zoomLevel: number) => void;
  onFitWidth: () => void;
  onToggleSidebar: () => void;
  onToggleSearch: () => void;
  onToggleViewMode: () => void;
  onToggleFullscreen: () => void;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  currentPage,
  totalPages,
  scale,
  viewMode,
  isSidebarOpen,
  isSearchOpen,
  isFullscreen,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
  onToggleSidebar,
  onToggleSearch,
  onToggleViewMode,
  onToggleFullscreen,
}) => {
  return (
    <div className="h-11 bg-white/95 dark:bg-[#12131a]/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800/80 px-3 flex items-center justify-between text-xs select-none z-20 shrink-0">
      {/* Left: Sidebar toggle & Page Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded transition-colors ${
            isSidebarOpen
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
          }`}
          title="Toggle page thumbnails sidebar"
        >
          <Sidebar size={15} />
        </button>

        <div className="h-4 w-[1px] bg-zinc-200 dark:border-zinc-800 mx-1" />

        {/* Page Nav Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
            title="Previous page (Left arrow / K)"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1 font-mono text-xs px-1.5 text-zinc-700 dark:text-zinc-300">
            <input
              type="text"
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  onPageChange(val);
                }
              }}
              className="w-8 text-center py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <span className="text-zinc-400">/</span>
            <span>{totalPages}</span>
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
            title="Next page (Right arrow / J)"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Center: Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onZoomOut}
          disabled={scale <= 0.6}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-30 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={14} />
        </button>

        <button
          onClick={() => onResetZoom(1.0)}
          className="font-mono text-xs text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-w-[50px] text-center"
          title="Reset zoom to 100%"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          onClick={onZoomIn}
          disabled={scale >= 2.5}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-30 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={14} />
        </button>

        <button
          onClick={onFitWidth}
          className="ml-1 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          title="Fit page to width"
        >
          Fit Width
        </button>
      </div>

      {/* Right: Search, View Mode, Fullscreen */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleSearch}
          className={`p-1.5 rounded transition-colors ${
            isSearchOpen
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
          }`}
          title="Search in document (/ or Cmd+F)"
        >
          <Search size={14} />
        </button>

        <button
          onClick={onToggleViewMode}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          title={`Switch to ${viewMode === 'continuous' ? 'Single Page' : 'Continuous Scroll'} mode`}
        >
          {viewMode === 'continuous' ? <Columns size={14} /> : <Square size={14} />}
        </button>

        <button
          onClick={onToggleFullscreen}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Distraction-Free Mode'}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  );
};
