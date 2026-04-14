import * as pdfjsLib from 'pdfjs-dist'

export interface PdfConvertOptions {
  format: 'webp' | 'jpeg' | 'png'
  quality: number
  scale: number
  maxWidth?: number
}

export interface PdfConvertedPage {
  pageNumber: number
  url: string
  blob: Blob
  width: number
  height: number
}

// Ensure the worker is configured properly for Vite setup
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

export async function processPdfFile(
  file: File,
  options: PdfConvertOptions,
  onProgress: (percent: number) => void
): Promise<PdfConvertedPage[]> {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdfDoc = await loadingTask.promise

  const totalPages = pdfDoc.numPages
  const results: PdfConvertedPage[] = []

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i)
    
    // Calculate viewport and dimensions
    let viewport = page.getViewport({ scale: options.scale })
    
    if (options.maxWidth && viewport.width > options.maxWidth) {
      const ratio = options.maxWidth / viewport.width
      viewport = page.getViewport({ scale: options.scale * ratio })
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context error')

    canvas.width = viewport.width
    canvas.height = viewport.height

    // Same white background trick for non-PNG formats
    if (options.format !== 'png') {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // @ts-ignore
    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise

    const mimeType = `image/${options.format}`
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error('toBlob failed'))
      }, mimeType, options.quality)
    })

    results.push({
      pageNumber: i,
      url: URL.createObjectURL(blob),
      blob,
      width: canvas.width,
      height: canvas.height
    })

    onProgress(Math.round((i / totalPages) * 100))
    // Give UI thread a breath
    await new Promise(r => setTimeout(r, 10))
  }

  return results
}
