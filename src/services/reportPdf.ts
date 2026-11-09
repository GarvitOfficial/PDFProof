import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { SignedCompletionReport } from '../types/report';

function formatDuration(totalSeconds: number): string {
  const sec = Math.round(totalSeconds);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h === 0) return `${m}m ${s}s`;
  return `${h}h ${remM}m ${s}s`;
}

function truncateString(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

/**
 * Generates an editorial, high-fidelity PDF report of the signed reading completion report.
 */
export async function generateReportPdf(report: SignedCompletionReport): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  const { payload, integrity } = report;

  // Page geometry: A4 (595.28 x 841.89 pt)
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const colorPrimary = rgb(0.08, 0.08, 0.1);
  const colorSecondary = rgb(0.4, 0.42, 0.45);
  const colorMuted = rgb(0.6, 0.62, 0.65);
  const colorBorder = rgb(0.88, 0.88, 0.9);
  const colorTableBg = rgb(0.97, 0.97, 0.98);
  const colorGreen = rgb(0.08, 0.6, 0.35);
  const colorAmber = rgb(0.8, 0.5, 0.05);

  const checkPageSpace = (needed: number) => {
    if (y - needed < margin + 30) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  // Header Title
  page.drawText('PDFProof', {
    x: margin,
    y: y - 10,
    size: 20,
    font: fontBold,
    color: colorPrimary,
  });

  page.drawText('DOCUMENT READING & INTEGRITY REPORT', {
    x: margin + 95,
    y: y - 8,
    size: 8,
    font: fontBold,
    color: colorSecondary,
  });

  page.drawText(`Report ID: ${payload.reportId.substring(0, 16)}...`, {
    x: pageWidth - margin - 180,
    y: y - 9,
    size: 8,
    font: fontMono,
    color: colorSecondary,
  });

  y -= 26;

  // Divider line
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: colorBorder,
  });

  y -= 18;

  // Document Overview Box
  page.drawRectangle({
    x: margin,
    y: y - 72,
    width: contentWidth,
    height: 72,
    color: colorTableBg,
    borderColor: colorBorder,
    borderWidth: 1,
  });

  page.drawText('DOCUMENT METADATA', {
    x: margin + 12,
    y: y - 14,
    size: 7.5,
    font: fontBold,
    color: colorSecondary,
  });

  page.drawText(`File: ${truncateString(payload.document.filename, 42)}`, {
    x: margin + 12,
    y: y - 28,
    size: 9.5,
    font: fontBold,
    color: colorPrimary,
  });

  const sizeKb = (payload.document.fileSize / 1024).toFixed(1);
  page.drawText(`Size: ${sizeKb} KB  |  Total Pages: ${payload.document.totalPages}`, {
    x: margin + 12,
    y: y - 42,
    size: 8.5,
    font: fontRegular,
    color: colorSecondary,
  });

  page.drawText(`SHA-256: ${payload.document.sha256}`, {
    x: margin + 12,
    y: y - 58,
    size: 7.5,
    font: fontMono,
    color: colorPrimary,
  });

  // Context Info (Right Column in Box)
  if (payload.context.readerIdentifier) {
    page.drawText(`Reader: ${payload.context.readerIdentifier}`, {
      x: margin + 280,
      y: y - 28,
      size: 9,
      font: fontRegular,
      color: colorPrimary,
    });
  }

  if (payload.context.assignmentId) {
    page.drawText(`Assignment: ${payload.context.assignmentId}`, {
      x: margin + 280,
      y: y - 42,
      size: 8.5,
      font: fontRegular,
      color: colorSecondary,
    });
  }

  if (payload.context.expectedFingerprint) {
    const isMatched = payload.context.fingerprintMatched;
    page.drawText(`Expected Hash: ${isMatched ? 'MATCHED' : 'MISMATCH'}`, {
      x: margin + 280,
      y: y - 58,
      size: 8,
      font: fontBold,
      color: isMatched ? colorGreen : colorAmber,
    });
  }

  y -= 90;

  // Key Metrics Grid
  page.drawText('ENGAGEMENT SUMMARY', {
    x: margin,
    y: y,
    size: 9,
    font: fontBold,
    color: colorPrimary,
  });

  y -= 14;

  const cardWidth = (contentWidth - 24) / 4;
  const metricsCards = [
    { label: 'Active Reading Time', val: formatDuration(payload.metrics.totalActiveSeconds) },
    { label: 'Completion', val: `${payload.metrics.completionPercentage}%` },
    { label: 'Pages Visited', val: `${payload.metrics.pagesVisitedCount} / ${payload.metrics.totalPages}` },
    { label: 'Total Visits', val: `${payload.metrics.totalPageVisits}` },
  ];

  metricsCards.forEach((c, idx) => {
    const cx = margin + idx * (cardWidth + 8);
    page.drawRectangle({
      x: cx,
      y: y - 44,
      width: cardWidth,
      height: 44,
      color: colorTableBg,
      borderColor: colorBorder,
      borderWidth: 1,
    });

    page.drawText(c.label.toUpperCase(), {
      x: cx + 8,
      y: y - 14,
      size: 6.5,
      font: fontBold,
      color: colorSecondary,
    });

    page.drawText(c.val, {
      x: cx + 8,
      y: y - 34,
      size: 13,
      font: fontBold,
      color: colorPrimary,
    });
  });

  y -= 62;

  // Page Analytics Breakdown Table
  page.drawText('PAGE-LEVEL ENGAGEMENT BREAKDOWN', {
    x: margin,
    y: y,
    size: 9,
    font: fontBold,
    color: colorPrimary,
  });

  y -= 14;

  // Table header
  page.drawRectangle({
    x: margin,
    y: y - 18,
    width: contentWidth,
    height: 18,
    color: colorTableBg,
    borderColor: colorBorder,
    borderWidth: 1,
  });

  const cols = [
    { name: 'PAGE', x: margin + 8, w: 45 },
    { name: 'ACTIVE TIME', x: margin + 55, w: 75 },
    { name: 'VISITS', x: margin + 135, w: 50 },
    { name: 'MAX SCROLL DEPTH', x: margin + 195, w: 105 },
    { name: 'FIRST VISIT (UTC)', x: margin + 310, w: 95 },
    { name: 'LAST VISIT (UTC)', x: margin + 415, w: 90 },
  ];

  cols.forEach((col) => {
    page.drawText(col.name, {
      x: col.x,
      y: y - 12,
      size: 6.5,
      font: fontBold,
      color: colorSecondary,
    });
  });

  y -= 22;

  // Render rows
  const sortedPageMetrics = [...payload.pageMetrics].sort((a, b) => a.pageNumber - b.pageNumber);
  for (const m of sortedPageMetrics) {
    checkPageSpace(22);

    const isVisited = m.visitCount > 0 || m.activeSeconds > 0;
    const timeFormatted = formatDuration(m.activeSeconds);
    const firstStr = m.firstVisit ? m.firstVisit.substring(11, 19) : '--:--:--';
    const lastStr = m.lastVisit ? m.lastVisit.substring(11, 19) : '--:--:--';

    page.drawText(`Page ${m.pageNumber}`, {
      x: cols[0].x,
      y: y - 10,
      size: 7.5,
      font: fontBold,
      color: isVisited ? colorPrimary : colorMuted,
    });

    page.drawText(timeFormatted, {
      x: cols[1].x,
      y: y - 10,
      size: 7.5,
      font: fontMono,
      color: isVisited ? colorPrimary : colorMuted,
    });

    page.drawText(`${m.visitCount}`, {
      x: cols[2].x,
      y: y - 10,
      size: 7.5,
      font: fontRegular,
      color: isVisited ? colorPrimary : colorMuted,
    });

    page.drawText(`${m.maxScrollDepth}%`, {
      x: cols[3].x,
      y: y - 10,
      size: 7.5,
      font: fontMono,
      color: isVisited ? colorPrimary : colorMuted,
    });

    page.drawText(firstStr, {
      x: cols[4].x,
      y: y - 10,
      size: 7,
      font: fontMono,
      color: colorSecondary,
    });

    page.drawText(lastStr, {
      x: cols[5].x,
      y: y - 10,
      size: 7,
      font: fontMono,
      color: colorSecondary,
    });

    // Row separator line
    page.drawLine({
      start: { x: margin, y: y - 14 },
      end: { x: pageWidth - margin, y: y - 14 },
      thickness: 0.5,
      color: colorBorder,
    });

    y -= 16;
  }

  y -= 10;

  // Cryptographic Signature & Audit Proof Block
  checkPageSpace(120);

  page.drawText('CRYPTOGRAPHIC AUDIT PROOF', {
    x: margin,
    y: y,
    size: 9,
    font: fontBold,
    color: colorPrimary,
  });

  y -= 12;

  page.drawRectangle({
    x: margin,
    y: y - 76,
    width: contentWidth,
    height: 76,
    color: colorTableBg,
    borderColor: colorBorder,
    borderWidth: 1,
  });

  page.drawText(`DIGEST (${integrity.digestAlgorithm}):`, {
    x: margin + 10,
    y: y - 14,
    size: 6.5,
    font: fontBold,
    color: colorSecondary,
  });

  page.drawText(integrity.canonicalDigest, {
    x: margin + 10,
    y: y - 24,
    size: 7,
    font: fontMono,
    color: colorPrimary,
  });

  page.drawText(`DIGITAL SIGNATURE (${integrity.signatureAlgorithm}):`, {
    x: margin + 10,
    y: y - 36,
    size: 6.5,
    font: fontBold,
    color: colorSecondary,
  });

  page.drawText(truncateString(integrity.signature, 75), {
    x: margin + 10,
    y: y - 46,
    size: 7,
    font: fontMono,
    color: colorPrimary,
  });

  page.drawText(`PUBLIC KEY FINGERPRINT: ${integrity.keyFingerprint.substring(0, 32)}...`, {
    x: margin + 10,
    y: y - 62,
    size: 7,
    font: fontMono,
    color: colorSecondary,
  });

  y -= 94;

  // Footer Disclaimer
  page.drawText(
    'Verification notice: This report certifies cryptographic integrity of the recorded metrics against the original PDF SHA-256 fingerprint.',
    {
      x: margin,
      y: y,
      size: 6.5,
      font: fontRegular,
      color: colorSecondary,
    }
  );

  page.drawText(
    'Active reading time is calculated via IntersectionObserver, Visibility API, and client-side inactivity checks. Zero external telemetry.',
    {
      x: margin,
      y: y - 10,
      size: 6.5,
      font: fontRegular,
      color: colorMuted,
    }
  );

  return pdfDoc.save();
}

