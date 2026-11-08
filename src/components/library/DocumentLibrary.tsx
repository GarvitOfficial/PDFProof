import React, { useEffect, useState } from 'react';
import { useDocuments } from '../../context/DocumentContext';
import { DocumentMeta } from '../../types/document';
import { DocumentReadingSummary } from '../../types/tracking';
import { getAllSummaries } from '../../services/storage';
import { UploadZone } from './UploadZone';
import { DocumentCard } from './DocumentCard';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { FileText, Shield, Clock, BookOpen, Trash2 } from 'lucide-react';

interface DocumentLibraryProps {
  onOpenDocument: (docId: string) => void;
  onOpenAnalytics: (docId: string) => void;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  onOpenDocument,
  onOpenAnalytics,
}) => {
  const { documents, loadDocument, removeDocument, refreshDocumentsList } = useDocuments();
  const [summariesMap, setSummariesMap] = useState<Record<string, DocumentReadingSummary>>({});
  const [deleteTarget, setDeleteTarget] = useState<DocumentMeta | null>(null);

  useEffect(() => {
    (async () => {
      const summaries = await getAllSummaries();
      const map: Record<string, DocumentReadingSummary> = {};
      summaries.forEach((s) => {
        map[s.documentId] = s;
      });
      setSummariesMap(map);
    })();
  }, [documents]);

  const handleOpen = async (id: string) => {
    await loadDocument(id);
    onOpenDocument(id);
  };

  const handleViewAnalytics = async (id: string) => {
    await loadDocument(id);
    onOpenAnalytics(id);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await removeDocument(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Compute aggregate stats across library
  const totalDocs = documents.length;
  const totalActiveSeconds = Object.values(summariesMap).reduce(
    (acc, curr) => acc + (curr.totalActiveSeconds || 0),
    0
  );

  const formatTotalTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h === 0) return `${m}m read`;
    return `${h}h ${remM}m read`;
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider">
            <span>Client-Side Local Storage</span>
            <span>•</span>
            <span>Zero Cloud Telemetry</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 font-serif">
            Document Library
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
            Upload PDF documents to compute authentic SHA-256 fingerprints, track active page dwell time, and generate cryptographically signed completion records.
          </p>
        </div>

        {totalDocs > 0 && (
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#13141b] border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-lg shadow-subtle shrink-0">
            <div className="flex items-center gap-1.5">
              <BookOpen size={13} className="text-zinc-400" />
              <span>{totalDocs} {totalDocs === 1 ? 'doc' : 'docs'}</span>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-zinc-400" />
              <span>{formatTotalTime(totalActiveSeconds)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Upload & Sample Loading Section */}
      <section>
        <UploadZone
          onDocumentOpened={() => {
            if (documents.length > 0) {
              onOpenDocument(documents[0].id);
            }
          }}
        />
      </section>

      {/* Document Records List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
            Stored Documents ({totalDocs})
          </h2>
          {totalDocs > 0 && (
            <span className="text-[11px] text-zinc-400 font-mono">
              IndexedDB Persistent Cache
            </span>
          )}
        </div>

        {totalDocs === 0 ? (
          <div className="p-8 text-center rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-white/40 dark:bg-[#13141b]/40">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No documents stored yet. Drop a PDF above or select one of the built-in sample research papers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                meta={doc}
                summary={summariesMap[doc.id]}
                onOpen={() => handleOpen(doc.id)}
                onViewAnalytics={() => handleViewAnalytics(doc.id)}
                onDelete={() => setDeleteTarget(doc)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Document"
        description="Are you sure you want to remove this document and all its recorded reading analytics?"
      >
        <div className="space-y-4">
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">
            {deleteTarget?.filename}
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={confirmDelete}>
              Delete Document & Records
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
