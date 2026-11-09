import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  // Use relative worker URL copied into public/ or bundler resolution
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.mjs';
  }
}

export interface SearchMatch {
  pageNumber: number;
  matchIndex: number;
  snippet: string;
}

export interface PdfDocumentInfo {
  numPages: number;
  title?: string;
  author?: string;
}

/**
 * Loads a PDF document from an ArrayBuffer
 */
export async function loadPdf(data: ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
  // Use a copy of the buffer so PDF.js doesn't detach the stored ArrayBuffer
  const bufferCopy = data.slice(0);
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(bufferCopy),
    useSystemFonts: true,
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });
  return loadingTask.promise;
}

/**
 * Extracts metadata from a loaded PDF document
 */
export async function getPdfMetadata(pdfDoc: pdfjsLib.PDFDocumentProxy): Promise<PdfDocumentInfo> {
  const meta = await pdfDoc.getMetadata().catch(() => null);
  const info = meta?.info as Record<string, unknown> | undefined;
  return {
    numPages: pdfDoc.numPages,
    title: typeof info?.Title === 'string' && info.Title.trim() ? info.Title.trim() : undefined,
    author: typeof info?.Author === 'string' && info.Author.trim() ? info.Author.trim() : undefined,
  };
}

/**
 * Renders a single page onto an HTMLCanvasElement with HiDPI support.
 * Returns the active RenderTask so callers can cancel it if needed.
 */
export function renderPdfPage(
  page: pdfjsLib.PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number
): pdfjsLib.RenderTask {
  const pixelRatio = window.devicePixelRatio || 1;
  const viewport = page.getViewport({ scale: scale * pixelRatio });
  const cssViewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${cssViewport.width}px`;
  canvas.style.height = `${cssViewport.height}px`;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Fill canvas with white background initially
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return page.render({
    canvasContext: ctx,
    viewport,
  });
}

/**
 * Generates an image data URL for a thumbnail
 */
export async function generateThumbnailUrl(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  targetWidth: number = 140
): Promise<string> {
  const page = await pdfDoc.getPage(pageNumber);
  const initialViewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / initialViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderTask = page.render({
    canvasContext: ctx,
    viewport,
  });

  await renderTask.promise;
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Searches the entire document for occurrences of query text
 */
export async function searchPdf(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  query: string
): Promise<SearchMatch[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const results: SearchMatch[] = [];

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');

    const lowerPage = pageText.toLowerCase();
    let index = lowerPage.indexOf(cleanQuery);
    let matchCountOnPage = 0;

    while (index !== -1 && matchCountOnPage < 5) {
      const snippetStart = Math.max(0, index - 30);
      const snippetEnd = Math.min(pageText.length, index + cleanQuery.length + 30);
      const snippet =
        (snippetStart > 0 ? '...' : '') +
        pageText.substring(snippetStart, snippetEnd).trim() +
        (snippetEnd < pageText.length ? '...' : '');

      results.push({
        pageNumber: i,
        matchIndex: index,
        snippet,
      });

      matchCountOnPage++;
      index = lowerPage.indexOf(cleanQuery, index + cleanQuery.length);
    }
  }

  return results;
}

