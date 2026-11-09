import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SampleDocDef {
  id: string;
  filename: string;
  title: string;
  description: string;
  pageCount: number;
  generateBytes: () => Promise<ArrayBuffer>;
}

export const SAMPLE_DOCUMENTS: SampleDocDef[] = [
  {
    id: 'sample-academic-crypto',
    filename: 'zero-knowledge-reading-verification-v1.pdf',
    title: 'Zero-Knowledge Document Verification Architecture',
    description: 'A 4-page academic research paper detailing client-side cryptographic guarantees and tamper-evident reading telemetry.',
    pageCount: 4,
    generateBytes: async () => {
      const doc = await PDFDocument.create();
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 50;

      // Page 1: Abstract & Introduction
      {
        const page = doc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;

        page.drawText('JOURNAL OF PRIVACY-PRESERVING COMPUTING  |  VOL. 14, NO. 2', {
          x: margin,
          y: y - 10,
          size: 8,
          font: fontBold,
          color: rgb(0.4, 0.4, 0.4),
        });

        y -= 40;
        page.drawText('Zero-Knowledge Reading Verification:', {
          x: margin,
          y,
          size: 18,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        y -= 22;
        page.drawText('Client-Side Cryptographic Attestation Without Telemetry', {
          x: margin,
          y,
          size: 14,
          font: fontBold,
          color: rgb(0.2, 0.2, 0.2),
        });

        y -= 24;
        page.drawText('Dr. Elena Vance, Department of Applied Cryptography, Institute for Advanced Study', {
          x: margin,
          y,
          size: 9,
          font: fontOblique,
          color: rgb(0.35, 0.35, 0.35),
        });

        y -= 25;
        page.drawLine({
          start: { x: margin, y },
          end: { x: pageWidth - margin, y },
          thickness: 1,
          color: rgb(0.85, 0.85, 0.85),
        });

        y -= 25;
        page.drawText('ABSTRACT', {
          x: margin,
          y,
          size: 10,
          font: fontBold,
          color: rgb(0.15, 0.15, 0.15),
        });

        y -= 15;
        const abstractLines = [
          'Educational institutions and compliance frameworks frequently mandate proof that students',
          'and personnel have thoroughly reviewed statutory documents, research monographs, and safety codes.',
          'Traditional electronic reading systems compromise participant privacy by routing telemetry, eye tracking,',
          'and detailed cursor coordinates to proprietary centralized databases.',
          '',
          'In this paper, we formalize a local-first attestation protocol termed PDFProof. By evaluating viewport',
          'intersection ratios and interaction invariants entirely within the user agent sandbox, PDFProof constructs',
          'a canonical SHA-256 digest of page dwell times and scroll thresholds. An asymmetric Ed25519 digital',
          'signature is appended to establish tamper-evidence, permitting third-party verification without exposing',
          'ongoing behavior or transmitting raw PDF bytes across the network boundary.',
        ];
        abstractLines.forEach((line) => {
          page.drawText(line, {
            x: margin,
            y,
            size: 9,
            font: fontRegular,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= 14;
        });

        y -= 20;
        page.drawText('1. INTRODUCTION & THREAT MODEL', {
          x: margin,
          y,
          size: 11,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        y -= 16;
        const introLines = [
          'The proliferation of remote pedagogy and regulatory compliance monitoring has created severe',
          'surveillance tensions. Contemporary Learning Management Systems (LMS) instrument document viewing',
          'with continuous HTTP beaconing. Such architectures suffer from four critical deficiencies:',
          '',
          '1. Privacy Leakage: Centralized aggregators observe exact reading speeds and cognitive hesitations.',
          '2. Telemetry Vulnerabilities: Intermediate middleboxes and network eavesdroppers intercept viewing logs.',
          '3. Single Point of Tampering: Central database administrators can retroactively modify or forge logs.',
          '4. Offline Infeasibility: Readers in air-gapped environments are completely excluded from verification.',
          '',
          'Our work addresses these deficiencies through a purely decentralized, client-evaluated paradigm.',
        ];
        introLines.forEach((line) => {
          page.drawText(line, {
            x: margin,
            y,
            size: 9,
            font: fontRegular,
            color: rgb(0.25, 0.25, 0.25),
          });
          y -= 14;
        });
      }

      // Page 2: Mathematical Formulation
      {
        const page = doc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;

        page.drawText('2. MATHEMATICAL FORMULATION & DWELL TIME ESTIMATION', {
          x: margin,
          y,
          size: 11,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        y -= 20;
        const lines2 = [
          'Let D be a PDF document comprising N discrete pages P = {p_1, p_2, ..., p_N}.',
          'At any discrete timestamp t within a reading session S, the browser viewport defines a visible window V_t.',
          'For each page p_i, the IntersectionObserver calculates the intersection ratio alpha_i(t) in [0, 1].',
          '',
          'To prevent double-counting when multiple pages simultaneously occupy the viewport during continuous scrolling,',
          'the active incremental duration delta_t is partitioned according to the normalized weight:',
          '',
          '           w_i(t) = alpha_i(t) / sum_{j=1}^N alpha_j(t)',
          '',
          'Thus, the active reading time accumulated on page p_i over session duration [0, T] is rigorously defined as:',
          '',
          '           T_active(p_i) = integral_0^T [ w_i(t) * I_active(t) * I_visible(t) ] dt',
          '',
          'where I_active(t) in {0, 1} is the indicator function of user interaction within inactivity threshold tau,',
          'and I_visible(t) in {0, 1} indicates that the browser document object is in the foreground (Page Visibility API).',
          '',
          '3. SCROLL DEPTH VERIFICATION',
          'A page visit is defined as reaching intersection threshold alpha_i >= 0.25 for a minimum dwell period of',
          '800 milliseconds. Max scroll depth delta_scroll(p_i) computes the maximal vertical fraction traversed:',
          '',
          '           delta_scroll(p_i) = max_t ( min(H_i, y_viewport_bottom(t) - y_top(p_i)) / H_i ) * 100%',
        ];
        lines2.forEach((line) => {
          page.drawText(line, {
            x: margin,
            y,
            size: 9,
            font: fontRegular,
            color: rgb(0.25, 0.25, 0.25),
          });
          y -= 14;
        });
      }

      // Page 3: Cryptographic Integrity
      {
        const page = doc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;

        page.drawText('4. CRYPTOGRAPHIC ATTESTATION & SIGNATURE VERIFICATION', {
          x: margin,
          y,
          size: 11,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        y -= 20;
        const lines3 = [
          '4.1 Canonical Serialization',
          'Because JSON objects possess non-deterministic key ordering across different browser runtime engines,',
          'PDFProof applies an invariant canonicalization transform. All dictionary keys are sorted lexicographically,',
          'floating-point numbers are rounded to fixed decimals, and whitespace is stripped.',
          '',
          '4.2 Document Fingerprinting (SHA-256)',
          'The authentic PDF byte stream is hashed immediately upon file upload prior to parsing:',
          '           Fingerprint = SHA256(ArrayBuffer(PDF_Bytes))',
          'This fingerprint is inextricably bound to the completion report payload. Any replacement of the underlying',
          'document invalidates the report during verification.',
          '',
          '4.3 Ed25519 Asymmetric Signatures',
          'Signing uses RFC 8032 Ed25519 via Web Crypto. A 32-byte public key and 64-byte signature ensure:',
          '1. Non-repudiation of the client-side attestation.',
          '2. Instant verification in under 2 milliseconds in standard browsers.',
          '3. Quantum-resistant resistance against known Shor implementations at current parameter sizes.',
        ];
        lines3.forEach((line) => {
          page.drawText(line, {
            x: margin,
            y,
            size: 9,
            font: fontRegular,
            color: rgb(0.25, 0.25, 0.25),
          });
          y -= 14;
        });
      }

      // Page 4: Conclusion & References
      {
        const page = doc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;

        page.drawText('5. DISCUSSION & HONEST VERIFICATION BOUNDARIES', {
          x: margin,
          y,
          size: 11,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        y -= 20;
        const lines4 = [
          'An essential ethical principle of PDFProof is transparency regarding verification limits:',
          '- Cryptographic Integrity proves the report was generated by an authorized client and has not been edited.',
          '- Document Hash Matching proves the exact PDF file was the subject of the reading session.',
          '- Dwell time indicates engagement opportunity and interaction, but NOT neurological comprehension.',
          'We explicitly advise institutions against equating dwell time with verified cognition.',
          '',
          '6. REFERENCES',
          '[1] Berners-Lee, T., et al. "Architectural Principles of the World Wide Web." W3C Recommendation.',
          '[2] Bernstein, D. J. "High-speed high-security signatures." Journal of Cryptographic Engineering, 2012.',
          '[3] W3C Web Cryptography Working Group. "Web Cryptography API Specification", W3C Recommendation.',
          '[4] MDN Web Docs. "Intersection Observer API & Page Visibility API Guidelines", 2024.',
        ];
        lines4.forEach((line) => {
          page.drawText(line, {
            x: margin,
            y,
            size: 9,
            font: fontRegular,
            color: rgb(0.25, 0.25, 0.25),
          });
          y -= 14;
        });
      }

      const pdfBytes = await doc.save();
      return pdfBytes.buffer as ArrayBuffer;
    },
  },
  {
    id: 'sample-rfc-privacy',
    filename: 'rfc-8821-secure-client-telemetry.pdf',
    title: 'RFC 8821: Standard for Zero-Knowledge Client Telemetry',
    description: 'A 3-page internet engineering standard specifying client-side dwell time calculations and encrypted report distribution.',
    pageCount: 3,
    generateBytes: async () => {
      const doc = await PDFDocument.create();
      const fontMono = await doc.embedFont(StandardFonts.Courier);
      const fontMonoBold = await doc.embedFont(StandardFonts.CourierBold);

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 50;

      // Page 1
      {
        const page = doc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;

        page.drawText('Internet Engineering Task Force (IETF)                           RFC 8821', {
          x: margin,
          y: y - 10,
          size: 9,
          font: fontMono,
          color: rgb(0.2, 0.2, 0.2),
        });
        page.drawText('Request for Comments: 8821                                    Category: Standards', {
          x: margin,
          y: y - 22,
          size: 9,
          font: fontMono,
          color: rgb(0.2, 0.2, 0.2),
        });

        y -= 50;
        page.drawText('Standard Protocol for Client-Side Reading Telemetry & Attestation', {
          x: margin,
          y,
          size: 11,
          font: fontMonoBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        y -= 30;
        const text = [
          'Abstract',
          '   This document specifies protocols and canonical data schemas for',
          '   verifying client-side document reading completion without sending',
          '   telemetry data to third-party endpoints. The mechanism relies on',
          '   browser-resident cryptographic primitives, local storage, and',
          '   public-key signatures.',
          '',
          'Status of This Memo',
          '   This document is an Internet Standards Track document.',
          '',
          '1. Introduction',
          '   Auditors and compliance evaluators frequently demand confirmation that',
          '   critical policy documents have been inspected. Previous architectures',
          '   utilized surveillance spyware embedded within client renderers.',
          '   This specification establishes an open, verifiable standard for',
          '   privacy-preserving attestation.',
        ];
        text.forEach((t) => {
          page.drawText(t, {
            x: margin,
            y,
            size: 9,
            font: fontMono,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= 14;
        });
      }

      // Page 2
      {
        const page = doc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;

        page.drawText('RFC 8821                    Client Telemetry                November 2026', {
          x: margin,
          y: y - 10,
          size: 9,
          font: fontMono,
          color: rgb(0.2, 0.2, 0.2),
        });

        y -= 40;
        const text2 = [
          '2. State Machine and Inactivity Parameters',
          '   A conforming client MUST maintain a state variable S in {ACTIVE, IDLE, HIDDEN}.',
          '   - Transitions to IDLE MUST occur if no user inputs (pointer, keyboard, scroll)',
          '     are detected within threshold TAU (default = 30 seconds).',
          '   - Transitions to HIDDEN MUST occur whenever the document visibility state',
          '     is not visible.',
          '   - Accumulated reading time T MUST NOT increment during IDLE or HIDDEN states.',
          '',
          '3. Cryptographic Packaging',
          '   Reports MUST be serializable in three conforming representations:',
          '   a) JSON (canonical UTF-8, keys sorted alphabetically)',
          '   b) PDF (visual summary with embedded audit block)',
          '   c) Encrypted Envelope (AES-256-GCM authenticated container)',
        ];
        text2.forEach((t) => {
          page.drawText(t, {
            x: margin,
            y,
            size: 9,
            font: fontMono,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= 14;
        });
      }

      // Page 3
      {
        const page = doc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;

        page.drawText('RFC 8821                    Client Telemetry                November 2026', {
          x: margin,
          y: y - 10,
          size: 9,
          font: fontMono,
          color: rgb(0.2, 0.2, 0.2),
        });

        y -= 40;
        const text3 = [
          '4. Security and Privacy Considerations',
          '   The protocol guarantees confidential operation. No remote server communication',
          '   occurs during tracking. Private signing keys are stored exclusively in secure',
          '   client storage (IndexedDB) and NEVER exported unless explicitly initiated by the user.',
          '',
          '5. Author Contact Information',
          '   Security Working Group',
          '   Email: ietf-sec@pdfproof.internal',
        ];
        text3.forEach((t) => {
          page.drawText(t, {
            x: margin,
            y,
            size: 9,
            font: fontMono,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= 14;
        });
      }

      const pdfBytes = await doc.save();
      return pdfBytes.buffer as ArrayBuffer;
    },
  },
];

