import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DocumentMeta, StoredDocument } from '../types/document';
import { DocumentReadingSummary } from '../types/tracking';
import { SignedCompletionReport } from '../types/report';
import { KeyPairRecord, UserSettings } from '../types/settings';

const DB_NAME = 'pdfproof_local_db';
const DB_VERSION = 1;

interface PDFProofDB extends DBSchema {
  documents: {
    key: string; // documentId
    value: StoredDocument;
  };
  summaries: {
    key: string; // documentId
    value: DocumentReadingSummary;
  };
  reports: {
    key: string; // reportId
    value: SignedCompletionReport;
  };
  settings: {
    key: string;
    value: unknown;
  };
}

let dbPromise: Promise<IDBPDatabase<PDFProofDB>> | null = null;

function getDb(): Promise<IDBPDatabase<PDFProofDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PDFProofDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'meta.id' });
        }
        if (!db.objectStoreNames.contains('summaries')) {
          db.createObjectStore('summaries', { keyPath: 'documentId' });
        }
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'payload.reportId' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// --- Documents ---

export async function storeDocument(doc: StoredDocument): Promise<void> {
  const db = await getDb();
  await db.put('documents', doc);
}

export async function getDocument(id: string): Promise<StoredDocument | undefined> {
  const db = await getDb();
  return db.get('documents', id);
}

export async function getAllDocumentMetas(): Promise<DocumentMeta[]> {
  const db = await getDb();
  const all = await db.getAll('documents');
  return all.map((d) => d.meta).sort((a, b) => {
    const tA = a.lastReadAt || a.uploadedAt;
    const tB = b.lastReadAt || b.uploadedAt;
    return new Date(tB).getTime() - new Date(tA).getTime();
  });
}

export async function updateDocumentMeta(meta: DocumentMeta): Promise<void> {
  const db = await getDb();
  const existing = await db.get('documents', meta.id);
  if (existing) {
    existing.meta = meta;
    await db.put('documents', existing);
  }
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['documents', 'summaries'], 'readwrite');
  await tx.objectStore('documents').delete(id);
  await tx.objectStore('summaries').delete(id);
  await tx.done;
}

// --- Reading Summaries ---

export async function storeReadingSummary(summary: DocumentReadingSummary): Promise<void> {
  const db = await getDb();
  await db.put('summaries', summary);
}

export async function getReadingSummary(documentId: string): Promise<DocumentReadingSummary | undefined> {
  const db = await getDb();
  return db.get('summaries', documentId);
}

export async function getAllSummaries(): Promise<DocumentReadingSummary[]> {
  const db = await getDb();
  return db.getAll('summaries');
}

// --- Reports ---

export async function storeReport(report: SignedCompletionReport): Promise<void> {
  const db = await getDb();
  await db.put('reports', report);
}

export async function getReport(reportId: string): Promise<SignedCompletionReport | undefined> {
  const db = await getDb();
  return db.get('reports', reportId);
}

export async function getAllReports(): Promise<SignedCompletionReport[]> {
  const db = await getDb();
  return db.getAll('reports');
}

export async function deleteReport(reportId: string): Promise<void> {
  const db = await getDb();
  await db.delete('reports', reportId);
}

// --- Settings & KeyPairs ---

const DEFAULT_SETTINGS: UserSettings = {
  inactivityTimeoutSeconds: 30,
  theme: 'system',
  readerViewMode: 'continuous',
  defaultZoom: 'page-width',
  showReadingTicker: true,
  enableSoundEffects: false,
};

export async function getUserSettings(): Promise<UserSettings> {
  const db = await getDb();
  const saved = (await db.get('settings', 'user_settings')) as UserSettings | undefined;
  return { ...DEFAULT_SETTINGS, ...saved };
}

export async function saveUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const db = await getDb();
  const current = await getUserSettings();
  const updated = { ...current, ...settings };
  await db.put('settings', updated, 'user_settings');
  return updated;
}

export async function getSigningKeyRecord(): Promise<KeyPairRecord | undefined> {
  const db = await getDb();
  return (await db.get('settings', 'signing_key_record')) as KeyPairRecord | undefined;
}

export async function saveSigningKeyRecord(record: KeyPairRecord): Promise<void> {
  const db = await getDb();
  await db.put('settings', record, 'signing_key_record');
}

// --- Database Maintenance & Export/Import ---

export async function purgeAllLocalData(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['documents', 'summaries', 'reports', 'settings'], 'readwrite');
  await tx.objectStore('documents').clear();
  await tx.objectStore('summaries').clear();
  await tx.objectStore('reports').clear();
  await tx.objectStore('settings').clear();
  await tx.done;
}

export async function getStorageUsageEstimate(): Promise<{ usageBytes: number; quotaBytes: number; percentage: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usageBytes = estimate.usage || 0;
    const quotaBytes = estimate.quota || 1;
    return {
      usageBytes,
      quotaBytes,
      percentage: Math.min(100, Math.round((usageBytes / quotaBytes) * 100)),
    };
  }
  return { usageBytes: 0, quotaBytes: 0, percentage: 0 };
}
