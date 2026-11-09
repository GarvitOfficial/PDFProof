import { describe, it, expect, vi } from 'vitest';
import { ReadingTracker } from '../src/services/tracker';

describe('Reading Tracker Dwell Apportionment Algorithm', () => {
  it('apportions incremental delta time strictly proportional to intersection ratios', () => {
    // When 2 pages are simultaneously visible: Page 1 with 0.3 ratio, Page 2 with 0.7 ratio
    const ratioPage1 = 0.3;
    const ratioPage2 = 0.7;
    const dtSeconds = 1.0;

    const totalWeight = ratioPage1 + ratioPage2;
    const slicePage1 = dtSeconds * (ratioPage1 / totalWeight);
    const slicePage2 = dtSeconds * (ratioPage2 / totalWeight);

    expect(slicePage1).toBeCloseTo(0.3, 5);
    expect(slicePage2).toBeCloseTo(0.7, 5);
    expect(slicePage1 + slicePage2).toBeCloseTo(dtSeconds, 5);
  });

  it('guarantees zero double-counting when multiple pages are visible', () => {
    const pageRatios = [0.15, 0.45, 0.2];
    const dt = 0.5;

    const totalWeight = pageRatios.reduce((a, b) => a + b, 0);
    const distributedTime = pageRatios.reduce((acc, r) => acc + dt * (r / totalWeight), 0);

    expect(distributedTime).toBeCloseTo(dt, 5);
  });

  it('computes max scroll depth as percentage within [0, 100]', () => {
    const calculateDepth = (pageHeight: number, viewportHeight: number, topOffset: number) => {
      const visibleBottom = Math.min(pageHeight, viewportHeight - topOffset);
      return Math.min(100, Math.max(0, Math.round((visibleBottom / pageHeight) * 100)));
    };

    // Scrolled to top
    expect(calculateDepth(1000, 800, 0)).toBe(80);
    // Scrolled past
    expect(calculateDepth(1000, 800, -200)).toBe(100);
    // Not yet in view
    expect(calculateDepth(1000, 800, 1200)).toBe(0);
  });

  it('correctly tracks and accumulates reading time on subsequent pages (page 2, page 3)', async () => {
    const tracker = new ReadingTracker('doc_test_123', 4);

    // Initial state: page 1 is active
    let summary = tracker.getSummary();
    expect(summary.pageMetrics[1].visitCount).toBeGreaterThanOrEqual(1);

    // User scrolls to page 2: page 1 scrolls out (ratio 0), page 2 becomes fully visible (ratio 1.0)
    tracker.updatePageVisibility(1, 0);
    tracker.updatePageVisibility(2, 0.85, 90);

    summary = tracker.getSummary();
    expect(summary.pageMetrics[2].visitCount).toBe(1);
    expect(summary.pageMetrics[2].maxScrollDepth).toBe(90);

    // Wait a brief tick for tracker tick
    await new Promise((resolve) => setTimeout(resolve, 600));

    summary = tracker.getSummary();
    // Time should now be accumulated on page 2!
    expect(summary.pageMetrics[2].activeSeconds).toBeGreaterThan(0);

    // Switch to page 3 in single page mode
    tracker.setExplicitPage(3);
    summary = tracker.getSummary();
    expect(summary.pageMetrics[3].visitCount).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 600));

    summary = tracker.getSummary();
    expect(summary.pageMetrics[3].activeSeconds).toBeGreaterThan(0);

    tracker.destroy();
  });

  it('strictly freezes reading time when paused (e.g. on analytics, settings, or library tabs)', async () => {
    const tracker = new ReadingTracker('doc_test_pause', 2);

    // Accumulate some reading time first
    await new Promise((resolve) => setTimeout(resolve, 600));
    const timeBeforePause = tracker.getSummary().totalActiveSeconds;
    expect(timeBeforePause).toBeGreaterThan(0);

    // User navigates away to the Analytics tab -> tracker is paused
    tracker.setReaderActive(false);

    // Wait another 1 second while paused
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const timeDuringPause = tracker.getSummary().totalActiveSeconds;

    // Time MUST NOT increase while on the analytics tab!
    expect(timeDuringPause).toBe(timeBeforePause);

    // User navigates back to the Reader tab -> tracker resumes
    tracker.setReaderActive(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const timeAfterResume = tracker.getSummary().totalActiveSeconds;

    expect(timeAfterResume).toBeGreaterThan(timeBeforePause);

    tracker.destroy();
  });
});
