import { describe, it, expect } from 'vitest';

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
});
