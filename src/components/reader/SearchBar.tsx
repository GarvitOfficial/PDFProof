import React, { useEffect, useRef, useState } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { searchPdf, SearchMatch } from '../../services/pdfService';

interface SearchBarProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  isOpen: boolean;
  onClose: () => void;
  onJumpToPage: (page: number) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  pdfDoc,
  isOpen,
  onClose,
  onJumpToPage,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setCurrentIndex(-1);
    }
  }, [isOpen]);

  const handleSearch = async (searchTerm: string) => {
    setQuery(searchTerm);
    if (!pdfDoc || searchTerm.trim().length < 2) {
      setResults([]);
      setCurrentIndex(-1);
      return;
    }

    setIsSearching(true);
    try {
      const matches = await searchPdf(pdfDoc, searchTerm);
      setResults(matches);
      if (matches.length > 0) {
        setCurrentIndex(0);
        onJumpToPage(matches[0].pageNumber);
      } else {
        setCurrentIndex(-1);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleNext = () => {
    if (results.length === 0) return;
    const nextIdx = (currentIndex + 1) % results.length;
    setCurrentIndex(nextIdx);
    onJumpToPage(results[nextIdx].pageNumber);
  };

  const handlePrev = () => {
    if (results.length === 0) return;
    const prevIdx = (currentIndex - 1 + results.length) % results.length;
    setCurrentIndex(prevIdx);
    onJumpToPage(results[prevIdx].pageNumber);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-13 right-6 z-30 bg-white dark:bg-[#151620] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-elevated dark:shadow-dark-elevated p-2 flex items-center gap-2 select-none animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-2.5 text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search in PDF..."
          className="w-56 text-xs pl-8 pr-3 py-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.shiftKey) handlePrev();
              else handleNext();
            } else if (e.key === 'Escape') {
              onClose();
            }
          }}
        />
      </div>

      <div className="text-[11px] font-mono text-zinc-500 min-w-[50px] text-center">
        {isSearching
          ? '...'
          : results.length > 0
          ? `${currentIndex + 1}/${results.length}`
          : query.length >= 2
          ? '0 found'
          : ''}
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={handlePrev}
          disabled={results.length === 0}
          className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-30 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={handleNext}
          disabled={results.length === 0}
          className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-30 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Next match (Enter)"
        >
          <ChevronDown size={14} />
        </button>
        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Close search (Esc)"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

