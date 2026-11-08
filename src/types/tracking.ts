export interface PageReadingMetrics {
  pageNumber: number;
  activeSeconds: number;
  visitCount: number;
  maxScrollDepth: number; // 0 to 100 percentage
  firstVisit: string | null; // ISO 8601
  lastVisit: string | null;  // ISO 8601
}

export interface ReadingSession {
  sessionId: string;
  documentId: string;
  startedAt: string;
  endedAt: string;
  totalDurationSeconds: number;
  activeReadingSeconds: number;
  idleSeconds: number;
  pagesVisited: number[];
  viewportWidth: number;
  viewportHeight: number;
}

export interface DocumentReadingSummary {
  documentId: string;
  totalActiveSeconds: number;
  totalPages: number;
  pagesVisitedCount: number;
  completionPercentage: number;
  totalPageVisits: number;
  sessionCount: number;
  averageSecondsPerPage: number;
  pageMetrics: Record<number, PageReadingMetrics>;
  sessions: ReadingSession[];
  lastUpdated: string;
}

export type TrackingState = 'active' | 'idle' | 'hidden' | 'paused';
