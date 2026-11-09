import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DocumentMeta, StoredDocument } from '../types/document';
import { DocumentReadingSummary } from '../types/tracking';
import {
  deleteDocument,
  getAllDocumentMetas,
  getDocument,
  getReadingSummary,
  storeDocument,
  storeReadingSummary,
  updateDocumentMeta,
} from '../services/storage';
import { computeSha256 } from '../services/crypto';
import { getPdfMetadata, loadPdf } from '../services/pdfService';
import { SampleDocDef } from '../sampleData/samplePdfs';

interface DocumentContextType {
  documents: DocumentMeta[];
  currentDoc: StoredDocument | null;
  currentSummary: DocumentReadingSummary | null;
  isLoading: boolean;
  loadDocument: (id: string) => Promise<StoredDocument | null>;
  uploadPdfFile: (file: File, expectedFingerprint?: string) => Promise<StoredDocument>;
  loadSampleDocument: (sampleDef: SampleDocDef) => Promise<StoredDocument>;
  removeDocument: (id: string) => Promise<void>;
  updateExpectedFingerprint: (id: string, expectedHash: string) => Promise<void>;
  closeCurrentDocument: () => void;
  refreshDocumentsList: () => Promise<void>;
  refreshSummary: (docId: string) => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [currentDoc, setCurrentDoc] = useState<StoredDocument | null>(null);
  const [currentSummary, setCurrentSummary] = useState<DocumentReadingSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshDocumentsList = useCallback(async () => {
    try {
      const metas = await getAllDocumentMetas();
      setDocuments(metas);
    } catch (err) {
      console.error('Failed to load document list:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDocumentsList();
  }, [refreshDocumentsList]);

  const refreshSummary = useCallback(async (docId: string) => {
    try {
      const summary = await getReadingSummary(docId);
      if (summary) {
        setCurrentSummary(summary);
      }
    } catch (err) {
      console.warn('Failed to refresh summary:', err);
    }
  }, []);

  const loadDocument = async (id: string): Promise<StoredDocument | null> => {
    setIsLoading(true);
    try {
      const doc = await getDocument(id);
      if (doc) {
        // Update lastReadAt
        const updatedMeta: DocumentMeta = {
          ...doc.meta,
          lastReadAt: new Date().toISOString(),
        };
        await updateDocumentMeta(updatedMeta);
        doc.meta = updatedMeta;

        setCurrentDoc(doc);
        const summary = await getReadingSummary(id);
        setCurrentSummary(summary || null);
        await refreshDocumentsList();
        return doc;
      }
      return null;
    } catch (err) {
      console.error('Failed to load document:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPdfFile = async (
    file: File,
    expectedFingerprint?: string
  ): Promise<StoredDocument> => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Compute SHA-256 from raw original bytes
      const fingerprintSha256 = await computeSha256(arrayBuffer);

      // Inspect PDF with PDF.js
      const pdf = await loadPdf(arrayBuffer);
      const info = await getPdfMetadata(pdf);

      const normalizedExpected = expectedFingerprint?.trim().toLowerCase();
      const isFingerprintMatch = normalizedExpected
        ? fingerprintSha256.toLowerCase() === normalizedExpected
        : null;

      const docId = `doc_${fingerprintSha256.substring(0, 16)}`;
      const nowIso = new Date().toISOString();

      const meta: DocumentMeta = {
        id: docId,
        filename: file.name,
        fileSize: file.size,
        fingerprintSha256,
        totalPages: info.numPages,
        uploadedAt: nowIso,
        lastReadAt: nowIso,
        expectedFingerprint: normalizedExpected || undefined,
        isFingerprintMatch,
        title: info.title,
        author: info.author,
      };

      const stored: StoredDocument = {
        meta,
        pdfBytes: arrayBuffer,
      };

      await storeDocument(stored);

      // Initialize empty reading summary
      const initialSummary: DocumentReadingSummary = {
        documentId: docId,
        totalActiveSeconds: 0,
        totalPages: info.numPages,
        pagesVisitedCount: 0,
        completionPercentage: 0,
        totalPageVisits: 0,
        sessionCount: 0,
        averageSecondsPerPage: 0,
        pageMetrics: {},
        sessions: [],
        lastUpdated: nowIso,
      };

      for (let i = 1; i <= info.numPages; i++) {
        initialSummary.pageMetrics[i] = {
          pageNumber: i,
          activeSeconds: 0,
          visitCount: 0,
          maxScrollDepth: 0,
          firstVisit: null,
          lastVisit: null,
        };
      }

      await storeReadingSummary(initialSummary);

      setCurrentDoc(stored);
      setCurrentSummary(initialSummary);
      await refreshDocumentsList();
      return stored;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleDocument = async (sampleDef: SampleDocDef): Promise<StoredDocument> => {
    setIsLoading(true);
    try {
      const arrayBuffer = await sampleDef.generateBytes();
      const fingerprintSha256 = await computeSha256(arrayBuffer);
      const pdf = await loadPdf(arrayBuffer);
      const info = await getPdfMetadata(pdf);

      const docId = `doc_${fingerprintSha256.substring(0, 16)}`;
      const nowIso = new Date().toISOString();

      const meta: DocumentMeta = {
        id: docId,
        filename: sampleDef.filename,
        fileSize: arrayBuffer.byteLength,
        fingerprintSha256,
        totalPages: info.numPages,
        uploadedAt: nowIso,
        lastReadAt: nowIso,
        title: sampleDef.title,
      };

      const stored: StoredDocument = {
        meta,
        pdfBytes: arrayBuffer,
      };

      await storeDocument(stored);

      // Check if existing summary exists
      let summary = await getReadingSummary(docId);
      if (!summary) {
        summary = {
          documentId: docId,
          totalActiveSeconds: 0,
          totalPages: info.numPages,
          pagesVisitedCount: 0,
          completionPercentage: 0,
          totalPageVisits: 0,
          sessionCount: 0,
          averageSecondsPerPage: 0,
          pageMetrics: {},
          sessions: [],
          lastUpdated: nowIso,
        };
        for (let i = 1; i <= info.numPages; i++) {
          summary.pageMetrics[i] = {
            pageNumber: i,
            activeSeconds: 0,
            visitCount: 0,
            maxScrollDepth: 0,
            firstVisit: null,
            lastVisit: null,
          };
        }
        await storeReadingSummary(summary);
      }

      setCurrentDoc(stored);
      setCurrentSummary(summary);
      await refreshDocumentsList();
      return stored;
    } finally {
      setIsLoading(false);
    }
  };

  const removeDocument = async (id: string) => {
    await deleteDocument(id);
    if (currentDoc?.meta.id === id) {
      setCurrentDoc(null);
      setCurrentSummary(null);
    }
    await refreshDocumentsList();
  };

  const updateExpectedFingerprint = async (id: string, expectedHash: string) => {
    const doc = await getDocument(id);
    if (!doc) return;

    const clean = expectedHash.trim().toLowerCase();
    const isMatch = clean.length > 0 ? doc.meta.fingerprintSha256.toLowerCase() === clean : null;

    const updatedMeta: DocumentMeta = {
      ...doc.meta,
      expectedFingerprint: clean || undefined,
      isFingerprintMatch: isMatch,
    };

    await updateDocumentMeta(updatedMeta);
    if (currentDoc?.meta.id === id) {
      setCurrentDoc({ ...doc, meta: updatedMeta });
    }
    await refreshDocumentsList();
  };

  const closeCurrentDocument = () => {
    setCurrentDoc(null);
    setCurrentSummary(null);
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        currentDoc,
        currentSummary,
        isLoading,
        loadDocument,
        uploadPdfFile,
        loadSampleDocument,
        removeDocument,
        updateExpectedFingerprint,
        closeCurrentDocument,
        refreshDocumentsList,
        refreshSummary,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export function useDocuments(): DocumentContextType {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error('useDocuments must be used within DocumentProvider');
  return ctx;
}

