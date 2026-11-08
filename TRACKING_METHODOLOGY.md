# PDFProof Reading Tracking Methodology & Formal Invariants

This document outlines the mathematical formulation, event-driven tracking pipeline, and ethical disclosure boundaries implemented in PDFProof.

---

## 1. Tracking Engine Architecture

PDFProof tracks document engagement using browser-resident web platform standards:

```
[User Window]
      │
      ├─► IntersectionObserver (Page Viewport Intersection Ratios)
      ├─► Page Visibility API (Document Foreground State)
      ├─► Window Focus / Blur Listeners
      ├─► Activity Event Bus (Pointer, Wheel, Touch, Keyboard)
      │
      ▼
[ReadingTracker State Machine]
      │
      ├─► Active Tick Delta (performance.now())
      ├─► Multi-Page Weight Apportionment (Prevents Double-Counting)
      ├─► Max Scroll Depth Computation (0-100%)
      │
      ▼
[IndexedDB Aggregation & Storage]
```

---

## 2. Inactivity Detection State Machine

The tracker maintains an internal state $S \in \{\text{ACTIVE}, \text{IDLE}, \text{HIDDEN}, \text{PAUSED}\}$:

1. **ACTIVE $\rightarrow$ IDLE**:
   If no user activity events (`mousemove`, `mousedown`, `keydown`, `scroll`, `touchstart`, `wheel`) are detected within the configurable threshold $\tau$ (default: 30 seconds), the tracker shifts to `IDLE`. Reading timer accumulation halts immediately.

2. **ACTIVE $\rightarrow$ HIDDEN**:
   When the user switches tabs, minimizes the browser, or triggers a visibility change (`document.hidden === true`), the tracker switches to `HIDDEN`. Dwell time accumulation ceases.

3. **IDLE / HIDDEN $\rightarrow$ ACTIVE**:
   Upon the first user interaction event or document refocus, the tracker restores `ACTIVE` status and updates the interaction timestamp using high-resolution monotonic time (`performance.now()`).

---

## 3. Multi-Page Dwell Apportionment (Zero Double-Counting)

In continuous vertical scrolling modes, multiple PDF pages frequently appear inside the viewport simultaneously. Simple timers would falsely accumulate $2 \times$ or $3 \times$ wall-clock time.

To ensure strict mathematical conservation of time:
Let $N$ be the total pages. For any time delta $\Delta t$, let $\alpha_i \in [0, 1]$ be the intersection ratio of page $i$.

The total visible weight is:
$$W = \sum_{j=1}^N \alpha_j$$

If $W > 0$, the incremental active time awarded to page $i$ is:
$$\Delta t_i = \Delta t \times \frac{\alpha_i}{W}$$

Because $\sum_{i=1}^N \Delta t_i = \Delta t$, **the sum of all page dwell increments exactly equals the elapsed active delta time**, eliminating double-counting.

---

## 4. Maximum Scroll Depth Tracking

For each visible page container, the maximum vertical travel is monitored:

$$\delta_{\text{scroll}}(p_i) = \min\left(100, \max\left(0, \left\lfloor \frac{\min(H_i, y_{\text{viewport\_bottom}} - y_{\text{top}}(p_i))}{H_i} \times 100 \right\rfloor \right)\right)$$

The maximum percentage reached across the entire document lifecycle is persisted.

---

## 5. Ethical Disclosure: Engagement vs. Attention

> [!CAUTION]
> **Reading Engagement is NOT Neurological Attention:**
> PDFProof measures that a document page was rendered on screen, in a foreground browser window, with regular user pointer/keyboard activity.
>
> While this guarantees that the document was present and actively scrolled by a user, it **cannot** measure cognitive comprehension, retention, or whether the reader was diverted by another physical screen or conversation. Educational and compliance auditors must interpret dwell time as **opportunity for engagement**, not verified neurological retention.
