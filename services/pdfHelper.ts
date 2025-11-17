import * as pdfjsLib from 'pdfjs-dist';

// Configure worker - use unpkg CDN which works better with Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

export async function convertPdfToImages(file: File): Promise<string[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const images: string[] = [];
    const numPages = pdf.numPages;

    // Process all pages
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      // Set up canvas with high quality
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Convert canvas to base64 image
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      images.push(imageData);
    }

    return images;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw new Error('Failed to process PDF file. Please try a different file or use an image instead.');
  }
}

// Keep the old function for backwards compatibility
export async function convertPdfToImage(file: File): Promise<string> {
  const images = await convertPdfToImages(file);
  return images[0]; // Return first page for single image use
}
