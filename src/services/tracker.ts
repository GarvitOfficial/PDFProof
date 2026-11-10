import {
  DocumentReadingSummary,
  PageReadingMetrics,
  ReadingSession,
  TrackingState,
} from '../types/tracking';
import { storeReadingSummary } from './storage';

export interface PageVisibilityEntry {
  pageNumber: number;
  intersectionRatio: number;
  boundingClientRect: DOMRectReadOnly;
  intersectionRect: DOMRectReadOnly;
}

export type TrackingStateCallback = (state: {
  status: TrackingState;
  activeSeconds: number;
  idleSeconds: number;
  currentPageNumber: number;
  totalPages: number;
  completionPercentage: number;
  pageMetrics: Record<number, PageReadingMetrics>;
}) => void;

function createRect(x = 0, y = 0, width = 0, height = 0): DOMRectReadOnly {
  if (typeof DOMRectReadOnly !== 'undefined') {
    return new DOMRectReadOnly(x, y, width, height);
  }
  return {
    x,
    y,
    width,
    height,
    top: y,
    bottom: y + height,
    left: x,
    right: x + width,
    toJSON: () => {},
  } as DOMRectReadOnly;
}

export class ReadingTracker {
  private documentId: string;
  private totalPages: number;
  private inactivityTimeoutMs: number;

  private currentSession: ReadingSession;
  private summary: DocumentReadingSummary;

  private trackingState: TrackingState = 'active';
  private isReaderActive: boolean = true;
  private lastTickTime: number = performance.now();
  private lastInteractionTime: number = performance.now();
  private tickIntervalId: ReturnType<typeof setInterval> | null = null;
  private flushTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private pageVisibilities: Map<number, PageVisibilityEntry> = new Map();
  private activePageCandidate: number = 1;
  private pageCandidateStartTime: number = performance.now();
  private lastRecordedVisitPage: number = 0;

  private callbacks: Set<TrackingStateCallback> = new Set();
  private isDestroyed: boolean = false;

  constructor(
    documentId: string,
    totalPages: number,
    initialSummary?: DocumentReadingSummary,
    inactivityTimeoutSeconds: number = 30
  ) {
    this.documentId = documentId;
    this.totalPages = Math.max(1, totalPages);
    this.inactivityTimeoutMs = inactivityTimeoutSeconds * 1000;

    const nowIso = new Date().toISOString();
    const sessionId = crypto.randomUUID ? crypto.randomUUID() : `session_${Date.now()}`;

    this.currentSession = {
      sessionId,
      documentId,
      startedAt: nowIso,
      endedAt: nowIso,
      totalDurationSeconds: 0,
      activeReadingSeconds: 0,
      idleSeconds: 0,
      pagesVisited: [],
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
      viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    };

    if (initialSummary) {
      this.summary = initialSummary;
    } else {
      const pageMetrics: Record<number, PageReadingMetrics> = {};
      for (let i = 1; i <= this.totalPages; i++) {
        pageMetrics[i] = {
          pageNumber: i,
          activeSeconds: 0,
          visitCount: 0,
          maxScrollDepth: 0,
          firstVisit: null,
          lastVisit: null,
        };
      }
      this.summary = {
        documentId,
        totalActiveSeconds: 0,
        totalPages: this.totalPages,
        pagesVisitedCount: 0,
        completionPercentage: 0,
        totalPageVisits: 0,
        sessionCount: 0,
        averageSecondsPerPage: 0,
        pageMetrics,
        sessions: [],
        lastUpdated: nowIso,
      };
    }

    // Initialize Page 1 as visible initially
    this.pageVisibilities.set(1, {
      pageNumber: 1,
      intersectionRatio: 1.0,
      boundingClientRect: createRect(0, 0, 800, 1000),
      intersectionRect: createRect(0, 0, 800, 1000),
    });
    this.recordPageVisit(1);

    this.initEventListeners();
    this.startTickLoop();
  }

  public subscribe(cb: TrackingStateCallback): () => void {
    this.callbacks.add(cb);
    this.notify();
    return () => {
      this.callbacks.delete(cb);
    };
  }

  private notify(): void {
    const activeSec = Math.round(this.summary.totalActiveSeconds);
    const idleSec = Math.round(this.currentSession.idleSeconds);
    const stateObj = {
      status: this.trackingState,
      activeSeconds: activeSec,
      idleSeconds: idleSec,
      currentPageNumber: this.activePageCandidate,
      totalPages: this.totalPages,
      completionPercentage: this.summary.completionPercentage,
      pageMetrics: { ...this.summary.pageMetrics },
    };
    for (const cb of this.callbacks) {
      try {
        cb(stateObj);
      } catch (err) {
        console.error('Tracker callback error:', err);
      }
    }
  }

  public pause(): void {
    this.isReaderActive = false;
    this.trackingState = 'paused';
    this.notify();
  }

  public resume(): void {
    this.isReaderActive = true;
    this.lastInteractionTime = performance.now();
    this.lastTickTime = performance.now();
    this.trackingState = 'active';
    this.notify();
  }

  public setReaderActive(active: boolean): void {
    if (active) {
      this.resume();
    } else {
      this.pause();
    }
  }

  private initEventListeners(): void {
    if (typeof window === 'undefined') return;

    const onActivity = () => {
      if (!this.isReaderActive) return;
      this.lastInteractionTime = performance.now();
      if (this.trackingState === 'idle') {
        this.trackingState = 'active';
        this.notify();
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'];
    activityEvents.forEach((ev) => {
      window.addEventListener(ev, onActivity, { passive: true });
    });

    const onVisibilityChange = () => {
      if (document.hidden) {
        this.trackingState = 'hidden';
      } else if (this.isReaderActive) {
        this.lastInteractionTime = performance.now();
        this.trackingState = 'active';
      } else {
        this.trackingState = 'paused';
      }
      this.notify();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    const onBlur = () => {
      if (this.trackingState === 'active') {
        this.trackingState = 'idle';
        this.notify();
      }
    };

    const onFocus = () => {
      if (!this.isReaderActive) return;
      this.lastInteractionTime = performance.now();
      this.trackingState = 'active';
      this.notify();
    };

    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    // Save before unload
    window.addEventListener('beforeunload', () => {
      this.flushSync();
    });
  }

  /**
   * Explicitly sets the active page (for single page view mode or page jumps)
   */
  public setExplicitPage(pageNumber: number): void {
    const p = Math.max(1, Math.min(this.totalPages, pageNumber));
    this.pageVisibilities.clear();
    this.pageVisibilities.set(p, {
      pageNumber: p,
      intersectionRatio: 1.0,
      boundingClientRect: createRect(0, 0, 800, 1000),
      intersectionRect: createRect(0, 0, 800, 1000),
    });

    this.activePageCandidate = p;
    this.pageCandidateStartTime = performance.now();
    this.recordPageVisit(p);
    this.notify();
  }

  /**
   * Updates page visibility ratio and scroll depth (called directly on scroll or by observer)
   */
  public updatePageVisibility(
    pageNumber: number,
    visibleRatio: number,
    scrollDepth?: number
  ): void {
    if (visibleRatio <= 0.01) {
      this.pageVisibilities.delete(pageNumber);
    } else {
      const existing = this.pageVisibilities.get(pageNumber);
      this.pageVisibilities.set(pageNumber, {
        pageNumber,
        intersectionRatio: visibleRatio,
        boundingClientRect: existing?.boundingClientRect || createRect(0, 0, 100, 100),
        intersectionRect: existing?.intersectionRect || createRect(0, 0, 100, 100),
      });

      if (typeof scrollDepth === 'number' && scrollDepth > 0) {
        const metric = this.summary.pageMetrics[pageNumber];
        if (metric && scrollDepth > metric.maxScrollDepth) {
          metric.maxScrollDepth = scrollDepth;
        }
      }
    }

    // Determine the page with highest visibility ratio
    let highestRatio = 0;
    let primaryPage = this.activePageCandidate;
    for (const [pNum, entry] of this.pageVisibilities.entries()) {
      if (entry.intersectionRatio > highestRatio) {
        highestRatio = entry.intersectionRatio;
        primaryPage = pNum;
      }
    }

    if (primaryPage !== this.activePageCandidate && highestRatio > 0.05) {
      this.activePageCandidate = primaryPage;
      this.pageCandidateStartTime = performance.now();
      this.recordPageVisit(primaryPage);
      this.notify();
    }
  }

  /**
   * Called by IntersectionObserver whenever page intersection changes
   */
  public updatePageIntersection(
    pageNumber: number,
    intersectionRatio: number,
    boundingClientRect: DOMRectReadOnly,
    intersectionRect: DOMRectReadOnly
  ): void {
    if (intersectionRatio <= 0.01) {
      this.pageVisibilities.delete(pageNumber);
    } else {
      this.pageVisibilities.set(pageNumber, {
        pageNumber,
        intersectionRatio,
        boundingClientRect,
        intersectionRect,
      });

      // Update scroll depth for this page
      this.calculatePageScrollDepth(pageNumber, boundingClientRect);
    }

    // Determine the page with highest visibility
    let highestRatio = 0;
    let primaryPage = this.activePageCandidate;
    for (const [pNum, entry] of this.pageVisibilities.entries()) {
      if (entry.intersectionRatio > highestRatio) {
        highestRatio = entry.intersectionRatio;
        primaryPage = pNum;
      }
    }

    if (primaryPage !== this.activePageCandidate && highestRatio > 0.05) {
      this.activePageCandidate = primaryPage;
      this.pageCandidateStartTime = performance.now();
      this.recordPageVisit(primaryPage);
      this.notify();
    }
  }

  private calculatePageScrollDepth(pageNumber: number, rect: DOMRectReadOnly): void {
    if (rect.height <= 0) return;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const visibleBottom = Math.min(rect.height, vh - rect.top);
    const depthPct = Math.min(100, Math.max(0, Math.round((visibleBottom / rect.height) * 100)));

    const metric = this.summary.pageMetrics[pageNumber];
    if (metric && depthPct > metric.maxScrollDepth) {
      metric.maxScrollDepth = depthPct;
    }
  }

  public recordPageVisit(pageNumber: number): void {
    const metric = this.summary.pageMetrics[pageNumber] || {
      pageNumber,
      activeSeconds: 0,
      visitCount: 0,
      maxScrollDepth: 0,
      firstVisit: null,
      lastVisit: null,
    };

    const nowIso = new Date().toISOString();
    if (!metric.firstVisit) {
      metric.firstVisit = nowIso;
    }
    metric.lastVisit = nowIso;
    metric.visitCount += 1;
    this.summary.pageMetrics[pageNumber] = metric;

    if (!this.currentSession.pagesVisited.includes(pageNumber)) {
      this.currentSession.pagesVisited.push(pageNumber);
      this.currentSession.pagesVisited.sort((a, b) => a - b);
    }

    this.recomputeAggregates();
  }

  private startTickLoop(): void {
    this.lastTickTime = performance.now();
    this.tickIntervalId = setInterval(() => {
      this.tick();
    }, 500);
  }

  private tick(): void {
    if (this.isDestroyed) return;

    const now = performance.now();
    const dt = Math.max(0, (now - this.lastTickTime) / 1000);
    this.lastTickTime = now;

    // Inactivity check (only when reader is active)
    if (this.isReaderActive && this.trackingState === 'active') {
      if (now - this.lastInteractionTime > this.inactivityTimeoutMs) {
        this.trackingState = 'idle';
        this.notify();
      }
    }

    // Accumulate time based on state strictly when reader is active
    if (this.isReaderActive && this.trackingState === 'active') {
      this.summary.totalActiveSeconds += dt;
      this.currentSession.activeReadingSeconds += dt;

      // Apportion reading time among currently visible pages strictly proportional to visibility ratio
      let totalWeight = 0;
      for (const entry of this.pageVisibilities.values()) {
        totalWeight += entry.intersectionRatio;
      }

      if (totalWeight > 0) {
        for (const [pNum, entry] of this.pageVisibilities.entries()) {
          const slice = dt * (entry.intersectionRatio / totalWeight);
          const metric = this.summary.pageMetrics[pNum];
          if (metric) {
            metric.activeSeconds += slice;
          }
        }
      } else if (this.activePageCandidate) {
        const metric = this.summary.pageMetrics[this.activePageCandidate];
        if (metric) {
          metric.activeSeconds += dt;
        }
      }
    } else if (this.isReaderActive && this.trackingState === 'idle') {
      this.currentSession.idleSeconds += dt;
    }

    this.currentSession.totalDurationSeconds =
      this.currentSession.activeReadingSeconds + this.currentSession.idleSeconds;
    this.currentSession.endedAt = new Date().toISOString();

    this.recomputeAggregates();
    this.notify();
    this.scheduleDebouncedFlush();
  }

  private recomputeAggregates(): void {
    let visitedCount = 0;
    let totalVisits = 0;

    for (let i = 1; i <= this.totalPages; i++) {
      const metric = this.summary.pageMetrics[i];
      if (metric) {
        if (metric.visitCount > 0 || metric.activeSeconds >= 1) {
          visitedCount++;
        }
        totalVisits += metric.visitCount;
      }
    }

    this.summary.pagesVisitedCount = visitedCount;
    this.summary.completionPercentage = Math.min(
      100,
      Math.round((visitedCount / this.totalPages) * 100)
    );
    this.summary.totalPageVisits = totalVisits;
    this.summary.averageSecondsPerPage =
      visitedCount > 0 ? this.summary.totalActiveSeconds / visitedCount : 0;
    this.summary.lastUpdated = new Date().toISOString();
  }

  private scheduleDebouncedFlush(): void {
    if (this.flushTimeoutId !== null) return;
    this.flushTimeoutId = setTimeout(() => {
      this.flushTimeoutId = null;
      this.saveToStorage();
    }, 4000);
  }

  public async saveToStorage(): Promise<void> {
    if (!this.documentId) return;
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return;
    try {
      // Merge current session into sessions list
      const sessionCopy = { ...this.currentSession };
      const sessionsWithoutCurrent = this.summary.sessions.filter(
        (s) => s.sessionId !== sessionCopy.sessionId
      );
      this.summary.sessions = [...sessionsWithoutCurrent, sessionCopy];
      this.summary.sessionCount = this.summary.sessions.length;

      await storeReadingSummary(this.summary);
    } catch (err) {
      console.warn('Failed to save reading summary to storage:', err);
    }
  }

  public flushSync(): void {
    this.saveToStorage();
  }

  public getSummary(): DocumentReadingSummary {
    return { ...this.summary };
  }

  public getCurrentSession(): ReadingSession {
    return { ...this.currentSession };
  }

  public setInactivityTimeout(seconds: number): void {
    this.inactivityTimeoutMs = Math.max(5, seconds) * 1000;
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.tickIntervalId !== null) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
    if (this.flushTimeoutId !== null) {
      clearTimeout(this.flushTimeoutId);
      this.flushTimeoutId = null;
    }
    this.saveToStorage();
    this.callbacks.clear();
  }
}
