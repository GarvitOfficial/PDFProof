import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDocuments } from '../../context/DocumentContext';
import { SAMPLE_DOCUMENTS } from '../../sampleData/samplePdfs';
import { Button } from '../common/Button';

interface UploadZoneProps {
  onDocumentOpened: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onDocumentOpened }) => {
  const { uploadPdfFile, loadSampleDocument, isLoading } = useDocuments();
  const [isDragging, setIsDragging] = useState(false);
  const [expectedHashInput, setExpectedHashInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sampleLoadingId, setSampleLoadingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please upload a valid PDF document (.pdf).');
      return;
    }
    setErrorMessage(null);

    try {
      await uploadPdfFile(file, expectedHashInput || undefined);
      onDocumentOpened();
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMessage('Failed to parse or fingerprint PDF. Ensure the file is not corrupted.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleLoadSample = async (sample: typeof SAMPLE_DOCUMENTS[0]) => {
    setSampleLoadingId(sample.id);
    setErrorMessage(null);
    try {
      await loadSampleDocument(sample);
      onDocumentOpened();
    } catch (err) {
      console.error('Failed to load sample:', err);
      setErrorMessage('Error generating sample document.');
    } finally {
      setSampleLoadingId(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Drag & Drop Surface */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative cursor-pointer border border-dashed rounded-lg p-8 sm:p-10 text-center transition-all ${
          isDragging
            ? 'border-zinc-500 bg-zinc-100/80 dark:border-zinc-500 dark:bg-zinc-800/40'
            : 'border-zinc-300 dark:border-zinc-800 bg-white/60 dark:bg-[#13141b]/60 hover:border-zinc-400 dark:hover:border-zinc-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="mx-auto w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
          <UploadCloud size={18} />
        </div>

        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Drop a PDF document here, or <span className="underline decoration-zinc-400 underline-offset-2">browse</span>
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          Files are hashed locally using SHA-256 and stored in IndexedDB. No server uploads, 100% private.
        </p>
      </div>

      {/* Advanced Fingerprint Comparison Toggle */}
      <div className="px-1">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors inline-flex items-center gap-1 font-medium"
        >
          <span>{showAdvanced ? 'Hide' : 'Optionally'} compare with expected SHA-256 hash</span>
        </button>

        {showAdvanced && (
          <div className="mt-2.5 p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#13141b] space-y-2">
            <label className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              Instructor / Required Document SHA-256:
            </label>
            <input
              type="text"
              value={expectedHashInput}
              onChange={(e) => setExpectedHashInput(e.target.value)}
              placeholder="e.g. 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
              className="w-full text-xs font-mono px-3 py-1.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Instant Test Sample Documents */}
      <div className="pt-2">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2.5">
          <Sparkles size={13} className="text-amber-500" />
          <span>Instant Evaluation Documents (Built-in)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleLoadSample(sample)}
              className="p-3.5 rounded border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#13141b] hover:border-zinc-400 dark:hover:border-zinc-700 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                    {sample.title}
                  </h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {sample.pageCount} pages
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-850/60">
                <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[200px]">
                  {sample.filename}
                </span>
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:underline inline-flex items-center gap-1">
                  {sampleLoadingId === sample.id ? 'Generating...' : 'Open Sample →'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

