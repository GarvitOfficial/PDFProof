# PDFProof

> **A premium, privacy-first PDF reading analytics and cryptographic verification application.**  
> Built entirely in the browser. Zero telemetry. 100% client-side evaluation.

---

## Overview

PDFProof provides an editorial, distraction-free document reading environment coupled with high-resolution engagement tracking and tamper-evident cryptographic reports.

Designed with inspiration from tools like **Linear**, **Raycast**, **Readwise Reader**, and **Notion**, PDFProof avoids generic AI dashboard tropes in favor of restrained editorial typography, high information density, and mathematically verifiable telemetry.

---

## Core Capabilities

1. **Document Library & Fingerprinting**:
   - Instant SHA-256 fingerprinting computed from original PDF byte streams.
   - Verification against expected/instructor hashes with mismatch alerts.
   - Built-in sample academic whitepapers for instant zero-friction testing.
   - Local IndexedDB persistence for all documents and metrics.

2. **Editorial PDF Reader**:
   - High-fidelity PDF rendering using PDF.js with Retina/HiDPI canvas support.
   - Continuous vertical scroll or single-page view modes.
   - Collapsible page thumbnails sidebar with live visit indicators.
   - In-document full-text search with instant jump.
   - Smooth zoom controls (in, out, fit-to-width, presets).
   - Distraction-free / Zen mode and keyboard shortcuts (`J`/`K` navigation, `/` search, `F` fullscreen).

3. **Accurate Engagement Tracking Engine**:
   - Page-level dwell time via `IntersectionObserver` with proportional multi-page weight distribution (strictly prevents double-counting).
   - Foreground tracking via the `Page Visibility API` (no dwell time accumulated in background tabs).
   - Configurable inactivity detection (pauses after 15s–120s of no pointer/keyboard events).
   - Monotonic microsecond delta timing with `performance.now()`.
   - Maximum scroll depth tracking per page (0% to 100%).
   - Explicit ethical disclosures distinguishing engagement opportunity from neurological comprehension.

4. **Analytics Dashboard**:
   - Executive KPIs: Total active dwell time, completion %, pages visited, average seconds per page, revisits, and reading sessions.
   - Page Engagement Heatmap with intensity grading and interactive page inspect.
   - Granular page-by-page data table with multi-column sorting and scroll depth bars.
   - Session history timeline recording viewport dimensions, active time, and idle periods.

5. **Tamper-Evident Report Generation**:
   - Deterministic canonical JSON serialization.
   - Ed25519 digital signatures (RFC 8032) generated via browser-native Web Crypto.
   - Export options:
     - `completion-report.pdf` (editorial PDF generated client-side with `pdf-lib`).
     - `completion-report.json` (canonical JSON report signed with Ed25519).
     - `completion-report.encrypted` (AES-256-GCM + PBKDF2 passphrase-encrypted container).

6. **Cryptographic Verification Suite**:
   - Upload `.json` or `.encrypted` reports for instant audit.
   - Recalculates canonical SHA-256 payload digest.
   - Mathematically verifies Ed25519 signature against the signer's public key.
   - Optional upload of original PDF to confirm byte-for-byte SHA-256 match.
   - Honest distinction between mathematical integrity and institutional identity.

---

## Technical Stack

- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (editorial palette, custom font metrics, dark/light themes)
- **PDF Engine**: PDF.js (`pdfjs-dist`)
- **Report Generation**: `pdf-lib`
- **Cryptography**: Native Web Crypto API (`window.crypto.subtle` for SHA-256, Ed25519, AES-256-GCM, PBKDF2)
- **Persistence**: IndexedDB via `idb`
- **Iconography**: Lucide Icons
- **Testing**: Vitest (11 comprehensive unit tests covering crypto, canonicalization, tracking formulas, and report generation)

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)

### Installation

```bash
git clone https://github.com/username/PDFProof.git
cd PDFProof
npm install
```

### Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Running Tests

```bash
npm test
```

### Production Build

```bash
npm run build
```

The compiled static files will be located in `dist/`.

---

## Deployment to GitHub Pages

PDFProof is configured with relative base paths (`base: './'`) and requires zero backend services, making it deployable on any static hosting provider or GitHub Pages.

A complete GitHub Actions workflow is included at `.github/workflows/deploy.yml`. When pushed to your GitHub repository's `main` branch, the workflow will test, build, and deploy the application to GitHub Pages automatically.

---

## Documentation

- [SECURITY.md](./SECURITY.md): Threat model, cryptographic specifications, and privacy invariants.
- [TRACKING_METHODOLOGY.md](./TRACKING_METHODOLOGY.md): Mathematical dwell time equations, multi-page apportionment, and scroll depth formulas.

---

## Privacy Pledge

PDFProof collects **zero** telemetry. No server requests, no tracking beacons, no cloud storage. All documents and reading data remain inside your browser sandbox.

