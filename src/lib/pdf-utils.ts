import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker using unpkg which mirrors npm exactly for the corresponding package version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function loadPDF(url: string) {
  const loadingTask = pdfjsLib.getDocument({ url });
  return loadingTask.promise;
}

export async function renderPageToCanvas(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 2 // Render at high scale for quality
) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  const renderContext = {
    canvasContext: canvas.getContext('2d')!,
    viewport: viewport,
    canvas: canvas,
  };
  
  await page.render(renderContext).promise;
  return viewport;
}
