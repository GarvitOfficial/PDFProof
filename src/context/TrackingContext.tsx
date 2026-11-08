import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ReadingTracker } from '../services/tracker';
import { TrackingState } from '../types/tracking';
import { useDocuments } from './DocumentContext';
import { useSettings } from './SettingsContext';

interface TrackingContextType {
  tracker: ReadingTracker | null;
  status: TrackingState;
  activeSeconds: number;
  idleSeconds: number;
  currentPageNumber: number;
  completionPercentage: number;
  updatePageIntersection: (
    pageNumber: number,
    intersectionRatio: number,
    boundingClientRect: DOMRectReadOnly,
    intersectionRect: DOMRectReadOnly
  ) => void;
  flushTracking: () => Promise<void>;
}

const TrackingContext = createContext<TrackingContextType | null>(null);

export const TrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentDoc, currentSummary, refreshSummary } = useDocuments();
  const { settings } = useSettings();

  const [status, setStatus] = useState<TrackingState>('active');
  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [idleSeconds, setIdleSeconds] = useState<number>(0);
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);

  const trackerRef = useRef<ReadingTracker | null>(null);

  useEffect(() => {
    if (!currentDoc) {
      if (trackerRef.current) {
        trackerRef.current.destroy();
        trackerRef.current = null;
      }
      setStatus('active');
      setActiveSeconds(0);
      setIdleSeconds(0);
      setCurrentPageNumber(1);
      setCompletionPercentage(0);
      return;
    }

    // Clean up previous tracker
    if (trackerRef.current) {
      trackerRef.current.destroy();
    }

    const tracker = new ReadingTracker(
      currentDoc.meta.id,
      currentDoc.meta.totalPages,
      currentSummary || undefined,
      settings.inactivityTimeoutSeconds
    );
    trackerRef.current = tracker;

    const unsubscribe = tracker.subscribe((state) => {
      setStatus(state.status);
      setActiveSeconds(state.activeSeconds);
      setIdleSeconds(state.idleSeconds);
      setCurrentPageNumber(state.currentPageNumber);
      setCompletionPercentage(state.completionPercentage);
    });

    return () => {
      unsubscribe();
      tracker.destroy();
      trackerRef.current = null;
    };
  }, [currentDoc?.meta.id, settings.inactivityTimeoutSeconds]);

  const updatePageIntersection = (
    pageNumber: number,
    intersectionRatio: number,
    boundingClientRect: DOMRectReadOnly,
    intersectionRect: DOMRectReadOnly
  ) => {
    if (trackerRef.current) {
      trackerRef.current.updatePageIntersection(
        pageNumber,
        intersectionRatio,
        boundingClientRect,
        intersectionRect
      );
    }
  };

  const flushTracking = async () => {
    if (trackerRef.current && currentDoc) {
      await trackerRef.current.saveToStorage();
      await refreshSummary(currentDoc.meta.id);
    }
  };

  return (
    <TrackingContext.Provider
      value={{
        tracker: trackerRef.current,
        status,
        activeSeconds,
        idleSeconds,
        currentPageNumber,
        completionPercentage,
        updatePageIntersection,
        flushTracking,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
};

export function useTracking(): TrackingContextType {
  const ctx = useContext(TrackingContext);
  if (!ctx) throw new Error('useTracking must be used within TrackingProvider');
  return ctx;
}
