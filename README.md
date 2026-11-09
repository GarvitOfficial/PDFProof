<div align="center">

```
  ██████╗ ██████╗ ███████╗██████╗ ██████╗  ██████╗  ██████╗ ███████╗
  ██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔═══██╗██╔═══██╗██╔════╝
  ██████╔╝██║  ██║█████╗  ██████╔╝██████╔╝██║   ██║██║   ██║█████╗  
  ██╔═══╝ ██║  ██║██╔══╝  ██╔═══╝ ██╔══██╗██║   ██║██║   ██║██╔══╝  
  ██║     ██████╔╝██║     ██║     ██║  ██║╚██████╔╝╚██████╔╝██║     
  ╚═╝     ╚═════╝ ╚═╝     ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     
```

### Premium Client-Side PDF Reading Analytics & Cryptographic Verification

[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Client--Side-10b981?style=for-the-badge&logo=shield)](./SECURITY.md)
[![Zero Telemetry](https://img.shields.io/badge/Telemetry-Zero%20External%20Calls-0ea5e9?style=for-the-badge)](./SECURITY.md)
[![Signatures](https://img.shields.io/badge/Signatures-Ed25519%20(RFC%208032)-6366f1?style=for-the-badge)](./SECURITY.md)
[![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-f59e0b?style=for-the-badge)](./SECURITY.md)
[![Tests](https://img.shields.io/badge/Vitest-13%20Passing-10b981?style=for-the-badge)](./test/)
[![Deploy](https://img.shields.io/badge/Deploy-GitHub%20Pages%20Ready-000000?style=for-the-badge&logo=github)](https://pages.github.com/)

<p align="center">
  <strong>A distraction-free, privacy-preserving document reader with microsecond dwell-time measurement, page-level heatmaps, and tamper-evident cryptographic completion certificates.</strong>
  <br />
  <em>Zero cloud telemetry • Pure Web Crypto API • Sub-millisecond local evaluation</em>
</p>

---

</div>

## 📑 Table of Contents

- [Architectural Philosophy](#-architectural-philosophy)
- [System Architecture](#-system-architecture)
- [Core Features](#-core-features)
  - [1. Editorial Document Library & Instant Fingerprinting](#1-editorial-document-library--instant-fingerprinting)
  - [2. Distraction-Free PDF Reader](#2-distraction-free-pdf-reader)
  - [3. High-Fidelity Engagement Engine](#3-high-fidelity-engagement-engine)
  - [4. Deep Analytics Dashboard & Heatmap](#4-deep-analytics-dashboard--heatmap)
  - [5. Tri-Format Tamper-Evident Report Generator](#5-tri-format-tamper-evident-report-generator)
  - [6. Zero-Trust Cryptographic Verification Suite](#6-zero-trust-cryptographic-verification-suite)
  - [7. Privacy & Local Storage Manager](#7-privacy--local-storage-manager)
- [Reading Tracking Invariants & Math](#-reading-tracking-invariants--math)
  - [State Machine & Pause Guarantees](#state-machine--pause-guarantees)
  - [Multi-Page Conservation Formula](#multi-page-conservation-formula)
  - [Scroll Depth Metric](#scroll-depth-metric)
- [Cryptographic Primitives](#-cryptographic-primitives)
- [Keyboard Navigation](#-keyboard-navigation)
- [Quick Start](#-quick-start)
- [Automated Verification & Tests](#-automated-verification--tests)
- [GitHub Pages Deployment](#-github-pages-deployment)
- [Security Disclosure & Integrity Boundaries](#-security-disclosure--integrity-boundaries)
- [Privacy Pledge](#-privacy-pledge)

---

## 🏛 Architectural Philosophy

PDFProof was engineered from first principles as an antidote to generic AI SaaS dashboards:

| Generic Dashboard Anti-Patterns | PDFProof Editorial Standard |
| :--- | :--- |
| Purple/blue decorative gradients everywhere | Neutral stone and warm zinc editorial palette (`#faf9f5` / `#0c0d12`) |
| Uncalibrated and fabricated metrics | Exact microsecond timing via `performance.now()` & geometric intersection |
| Cloud surveillance beaconing & eye-tracking | **Zero telemetry**: 100% browser-resident sandbox evaluation |
| Cluttered cards with nonfunctional controls | High information density, tabular monospace numerals, and keyboard shortcuts |
| Insecure third-party crypto bundles | Native `window.crypto.subtle` (Ed25519, SHA-256, AES-GCM, PBKDF2) |

---

## ⚡ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER SANDBOX                                 │
│                                                                             │
│  ┌────────────────────┐      ┌──────────────────┐     ┌──────────────────┐  │
│  │   Uploaded PDF     │ ───► │  Raw Byte Array  │ ──► │  SHA-256 Finger- │  │
│  │   or Sample Paper  │      │   ArrayBuffer    │     │  print Engine    │  │
│  └────────────────────┘      └──────────────────┘     └────────┬─────────┘  │
│                                                                │            │
│  ┌─────────────────────────────────────────────────────────────▼─────────┐  │
│  │                       READING TRACKER ENGINE                          │  │
│  │  • Active Viewport Geometry (Visible Height / Page Ratio)              │  │
│  │  • Multi-Page Proportional Dwell Distribution (No Double-Counting)    │  │
│  │  • Page Visibility API (Suspends when tab hidden/minimized)          │  │
│  │  • Inactivity Detector (Pauses when user idle for > 30s)             │  │
│  │  • Navigation Context (Freezes when viewing Analytics/Settings tabs)  │  │
│  └─────────────────────────────┬─────────────────────────────────────────┘  │
│                                │ Live Page Metrics & Sessions               │
│                                ▼                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     INDEXEDDB PERSISTENCE (idb)                       │  │
│  │    [documents]      [reading_summaries]      [signed_reports]         │  │
│  └─────────────────────────────┬─────────────────────────────────────────┘  │
│                                │                                            │
│        ┌───────────────────────┴───────────────────────┐                    │
│        ▼                                               ▼                    │
│  ┌───────────────────────────┐           ┌───────────────────────────┐      │
│  │ REPORT ATTESTATION ENGINE │           │ ZERO-TRUST AUDIT SUITE    │      │
│  │ • Invariant Canonical JSON│           │ • Upload .json/.encrypted │      │
│  │ • Ed25519 Signatures      │           │ • Recalculate SHA-256     │      │
│  │ • PBKDF2 + AES-256-GCM    │           │ • Verify Ed25519 Sig      │      │
│  │ • PDF Report (pdf-lib)    │           │ • Match original PDF hash │      │
│  └───────────────────────────┘           └───────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Core Features

### 1. Editorial Document Library & Instant Fingerprinting
- **Drag-and-Drop Ingestion**: Upload any `.pdf` document with instant drag-and-drop or file picker.
- **SHA-256 Cryptographic Fingerprint**: Generated synchronously from original raw binary bytes before document parsing. Includes single-click copy and short-hash pills.
- **Expected Hash Comparison**: Enter an instructor or auditor's required SHA-256 hash to immediately verify authentic copy vs. modified/tampered syllabus or exam paper.
- **Instant Test Research Papers**: Two built-in academic monographs (*Zero-Knowledge Document Verification* & *RFC 8821 Standard*) generated dynamically with `pdf-lib` for one-click testing without finding local files.

### 2. Distraction-Free PDF Reader
- **High-DPI PDF.js Rendering**: Pristine canvas text display with subpixel optimization for Retina displays.
- **Dual View Modes**:
  - *Continuous Vertical Scroll*: Natural document flow with real-time multi-page viewport presence tracking.
  - *Single Page Presentation*: Dedicated distraction-free focus mode with instant page jumping.
- **Collapsible Thumbnails Sidebar**: Displays lazy-rendered page previews, real-time page reading timers (`14s`), and emerald visit-status indicators.
- **In-Document Search**: Interactive text search with occurrence counts, match navigation, and automatic jump.
- **Retina Zoom Controls**: Zoom in, zoom out, 100% reset, and smart `Fit Width` geometry calculation.

### 3. High-Fidelity Engagement Engine
- **Deterministic Viewport Math**: Calculates exact pixel overlap between the reader container and every page canvas on every frame.
- **Strict Anti-Double-Counting**: Active reading delta time is conserved and partitioned across visible pages proportional to their vertical exposure.
- **Automatic Background Freezing**: Reading time stops the instant the browser tab is switched, minimized, or window focus is lost.
- **Smart Pause on Other Tabs**: When navigating to the Analytics, Reports, or Settings views, the tracker automatically enters `PAUSED` mode—**reading time strictly halts and only resumes when returning to the Reader**.
- **Configurable Idle Detector**: Configurable inactivity timeouts (15s, 30s, 45s, 60s, 120s) pause tracking if no mouse, keyboard, touch, or scroll inputs occur.

### 4. Deep Analytics Dashboard & Heatmap
- **Executive KPI Cards**: Active reading duration, document completion percentage, visited page tally, total visits/revisits, distinct sessions, and average dwell time per page.
- **Page Engagement Heatmap**: Color-graded intensity grid visualizing dwell time concentration across the entire document. Hover any cell to inspect exact dwell time, visits, and scroll depth.
- **Granular Page Table**: Sortable table with active time, visit count, maximum scroll depth (with visual completion bar), first visit timestamp, and last visit timestamp.
- **Session Audit Timeline**: Chronological log of reading sessions capturing viewport dimensions, active time vs. idle time, and visited page sequences.

### 5. Tri-Format Tamper-Evident Report Generator
Generates three export formats certified by the reader's browser-resident cryptographic identity:
1. `completion-report.pdf`: An A4 document certificate rendered client-side using `pdf-lib` featuring document metadata, engagement summary cards, page breakdown tables, and an auditable cryptographic proof block.
2. `completion-report.json`: Deterministically canonicalized JSON report with embedded SHA-256 digest and Ed25519 digital signature.
3. `completion-report.encrypted`: Password-protected container encrypted with **AES-256-GCM** using a 256-bit key derived via **PBKDF2** (100,000 rounds of SHA-256) and a 96-bit random nonce.

### 6. Zero-Trust Cryptographic Verification Suite
- **Report Audit**: Drop any generated `.json` or `.encrypted` file to audit its mathematical authenticity.
- **Passphrase Decryption**: Seamlessly prompts for passphrase when an encrypted envelope is detected, decrypting in memory and verifying GCM authentication tags.
- **Digest Recalculation**: Reconstructs canonical JSON representation, recalculates SHA-256 digest, and flags if even a single byte or decimal has been tampered with.
- **Ed25519 Signature Verification**: Validates the cryptographic signature against the embedded public key using native Web Crypto.
- **Original PDF Dual-Check**: Upload the original PDF alongside the report to confirm byte-for-byte that the report corresponds to that exact file.

### 7. Privacy & Local Storage Manager
- **Local-Only Storage**: All documents, summaries, and keypairs reside in the origin's private IndexedDB database (`pdfproof_local_db`).
- **Quota & Storage Inspection**: View current storage consumption and browser storage quota.
- **Cryptographic Keypair Management**: Inspect your unique Ed25519 public key fingerprint, export Base64 public key, or regenerate identities.
- **One-Click Privacy Wipe**: Purge all local documents, reading logs, and keys with complete eradication.

---

## 📐 Reading Tracking Invariants & Math

### State Machine & Pause Guarantees

```
              ┌─────────────── Document Foreground / Input ──────────────┐
              │                                                          │
              ▼                                                          │
       ┌──────────────┐         Inactivity Timeout (τ)            ┌──────────────┐
       │    ACTIVE    │ ────────────────────────────────────────► │     IDLE     │
       │ (Accumulate) │ ◄──────────────────────────────────────── │ (Accumulate  │
       └──────┬───────┘               User Input                  │  Idle Time)  │
              │                                                   └──────────────┘
              │ Tab Hidden / Blur
              ▼
       ┌──────────────┐
       │    HIDDEN    │ ◄─── Document hidden or browser minimized
       │   (Frozen)   │
       └──────────────┘
              ▲
              │ Navigate to Analytics / Settings / Library
              ▼
       ┌──────────────┐
       │    PAUSED    │ ◄─── Reader view unmounted or tab inactive
       │   (Frozen)   │      Zero accumulation of active or idle time
       └──────────────┘
```

### Multi-Page Conservation Formula

When multiple pages appear simultaneously in the viewport during continuous vertical scrolling, wall-clock active time $\Delta t$ is distributed according to each page's intersection weight $\alpha_i \in [0, 1]$:

$$W = \sum_{j=1}^N \alpha_j$$

$$\Delta t_i = \Delta t \times \frac{\alpha_i}{W} \quad \text{where } W > 0$$

$$\sum_{i=1}^N \Delta t_i = \Delta t \times \sum_{i=1}^N \frac{\alpha_i}{W} = \Delta t$$

**Mathematical Proof of Time Conservation**: Dwell time is apportioned proportionally with zero double-counting.

### Scroll Depth Metric

For each page $i$, vertical progression is evaluated:

$$\delta_{\text{scroll}}(p_i) = \min\left(100, \max\left(0, \left\lfloor \frac{\min(H_i, y_{\text{viewport\_bottom}} - y_{\text{top}}(p_i))}{H_i} \times 100 \right\rfloor \right)\right)$$

---

## 🔒 Cryptographic Primitives

PDFProof utilizes the **W3C Web Cryptography API** (`window.crypto.subtle`) exclusively:

| Operation | Standard | Parameters | Implementation |
| :--- | :--- | :--- | :--- |
| **Document Fingerprint** | SHA-256 | FIPS 180-4, 256-bit digest | `crypto.subtle.digest('SHA-256', bytes)` |
| **Canonical Report Digest** | SHA-256 | Invariant sorted JSON serializer | Deterministic UTF-8 canonicalization |
| **Digital Signatures** | Ed25519 | RFC 8032, Edwards-curve DSA | `crypto.subtle.sign({ name: 'Ed25519' }, ...)` |
| **Key Derivation** | PBKDF2 | RFC 8018, HMAC-SHA256, 100,000 rounds | `crypto.subtle.deriveKey('PBKDF2', ...)` |
| **Authenticated Encryption**| AES-256-GCM | NIST SP 800-38D, 256-bit key, 96-bit nonce | `crypto.subtle.encrypt({ name: 'AES-GCM' }, ...)` |

---

## ⌨ Keyboard Navigation

The PDF Reader provides fast keyboard shortcuts inspired by vim and professional document readers:

| Shortcut | Action | Scope |
| :---: | :--- | :--- |
| <kbd>J</kbd> or <kbd>→</kbd> | Jump to next page | Reader |
| <kbd>K</kbd> or <kbd>←</kbd> | Jump to previous page | Reader |
| <kbd>/</kbd> or <kbd>Cmd</kbd>+<kbd>F</kbd> | Open in-document search | Reader |
| <kbd>Enter</kbd> / <kbd>Shift</kbd>+<kbd>Enter</kbd> | Next / Previous search match | Search Bar |
| <kbd>F</kbd> | Toggle Fullscreen distraction-free mode | Reader |
| <kbd>Esc</kbd> | Close Search / Dismiss Modal Dialog | Global |

---

## 🏁 Quick Start

### Prerequisites
- **Node.js** v18+ (tested on Node v20 & v26)
- **npm** v9+

### 1. Clone & Install
```bash
git clone https://github.com/username/monitorScroll.git
cd monitorScroll
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Test Suite
```bash
npm test
```

### 4. Build Production Bundle
```bash
npm run build
```
Optimized assets with relative paths are generated in `dist/`.

---

## 🧪 Automated Verification & Tests

The project includes 13 Vitest unit tests verifying cryptographic rigor, canonical serialization, and dwell-time invariants:

```
 RUN  v3.2.7 /Users/ganu/Programming/github/monitorScroll

 ✓ test/crypto.test.ts (5 tests)
   ✓ computes correct SHA-256 hashes consistently
   ✓ canonicalizes JSON objects deterministically regardless of key order
   ✓ generates Ed25519 keypairs, signs digests, and verifies correctly
   ✓ encrypts and decrypts with AES-256-GCM and PBKDF2 passphrase
   ✓ converts between Hex, Base64, and Buffer accurately

 ✓ test/report.test.ts (3 tests)
   ✓ signs and verifies a valid completion report
   ✓ detects tampering when payload fields are modified
   ✓ generates a valid, non-empty PDF binary report with pdf-lib

 ✓ test/tracker.test.ts (5 tests)
   ✓ apportions incremental delta time strictly proportional to intersection ratios
   ✓ guarantees zero double-counting when multiple pages are visible
   ✓ computes max scroll depth as percentage within [0, 100]
   ✓ correctly tracks and accumulates reading time on subsequent pages (page 2, page 3)
   ✓ strictly freezes reading time when paused (e.g. on analytics, settings, or library tabs)

 Test Files  3 passed (3)
      Tests  13 passed (13)
```

---

## 🌐 GitHub Pages Deployment

PDFProof is configured with relative base asset paths (`base: './'`) in `vite.config.ts`, allowing it to run smoothly on GitHub Pages, Cloudflare Pages, Netlify, or air-gapped offline environments without modification.

A production-ready GitHub Actions workflow is provided at `.github/workflows/deploy.yml`:
1. Push your repository to GitHub.
2. Under **Settings > Pages**, select **GitHub Actions** as the source.
3. Every push to `main` will automatically build, test, and publish your live app.

---

## 🛡 Security Disclosure & Integrity Boundaries

> [!IMPORTANT]
> **Ethical & Mathematical Disclosures:**
> 1. **Cryptographic Integrity $\neq$ Institutional Identity**: A verified report mathematically certifies that the reading metrics were captured for a designated SHA-256 document fingerprint and have not been altered since signing. It does not certify the legal real-world identity of the reader unless their Ed25519 public key has been registered with the verifying institution.
> 2. **Dwell Time $\neq$ Neurological Attention**: Dwell time confirms that the document was open in a foreground viewport with regular user interactions. It reflects opportunity for engagement rather than cognitive retention or neurological comprehension.

---

## 🤝 Privacy Pledge

PDFProof collects **zero** telemetry.
- No analytics scripts (no Google Analytics, no Mixpanel, no PostHog).
- No backend servers, databases, or remote workers.
- No network requests are made with document bytes, hashes, or timestamps.
- All operations execute inside your browser's private local sandbox.

---

<div align="center">
  <sub>Engineered with precision for researchers, students, and privacy-conscious readers.</sub>
</div>
