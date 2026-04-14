import * as pdfjsLib from 'pdfjs-dist'

export interface PdfConvertOptions {
  format: 'webp' | 'jpeg' | 'png'
  quality: number
  scale: number
  maxWidth?: number
  stitchLongImage?: boolean
}

export interface PdfConvertedPage {
  pageNumber: number // In long image mode, this acts as the "part" number
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

const MAX_CANVAS_HEIGHT = 30000 // Safe limit for browsers

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

  const mimeType = `image/${options.format}`

  // Standard non-stitch mode
  if (!options.stitchLongImage) {
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfDoc.getPage(i)
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

      if (options.format !== 'png') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // @ts-ignore
      await page.render({ canvasContext: ctx, viewport }).promise

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('toBlob failed')), mimeType, options.quality)
      })

      results.push({
        pageNumber: i,
        url: URL.createObjectURL(blob),
        blob,
        width: canvas.width,
        height: canvas.height
      })
      canvas.width = 0; canvas.height = 0; // Free memory
      onProgress(Math.round((i / totalPages) * 100))
      await new Promise(r => setTimeout(r, 10))
    }
    return results
  }

  // --- STITCH LONG IMAGE MODE ---
  // Pass 1: Gather dimensions
  const pagesInfo = []
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i)
    let viewport = page.getViewport({ scale: options.scale })
    if (options.maxWidth && viewport.width > options.maxWidth) {
      viewport = page.getViewport({ scale: options.scale * (options.maxWidth / viewport.width) })
    }
    pagesInfo.push({ page, viewport, originalIndex: i })
  }

  // Pass 2: Chunk by height limit
  const chunks: typeof pagesInfo[] = []
  let currentChunk: typeof pagesInfo = []
  let currentH = 0

  for (const info of pagesInfo) {
    if (currentH + info.viewport.height > MAX_CANVAS_HEIGHT && currentChunk.length > 0) {
      chunks.push(currentChunk)
      currentChunk = []
      currentH = 0
    }
    currentChunk.push(info)
    currentH += info.viewport.height
  }
  if (currentChunk.length > 0) chunks.push(currentChunk)

  // Pass 3: Render chunks
  let globalProcessed = 0
  for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
    const chunk = chunks[chunkIdx]
    const chunkWidth = Math.max(...chunk.map(c => c.viewport.width))
    const chunkHeight = chunk.reduce((sum, c) => sum + c.viewport.height, 0)

    const megaCanvas = document.createElement('canvas')
    megaCanvas.width = chunkWidth
    megaCanvas.height = chunkHeight
    const megaCtx = megaCanvas.getContext('2d')
    if (!megaCtx) throw new Error('Mega canvas ctx failed')

    if (options.format !== 'png') {
      megaCtx.fillStyle = '#FFFFFF'
      megaCtx.fillRect(0, 0, chunkWidth, chunkHeight)
    }

    let cursorY = 0
    for (const info of chunk) {
      // Render to exact sized small canvas to avoid displacement bugs
      const smallCanvas = document.createElement('canvas')
      smallCanvas.width = info.viewport.width
      smallCanvas.height = info.viewport.height
      const smallCtx = smallCanvas.getContext('2d')!
      
      if (options.format !== 'png') {
        smallCtx.fillStyle = '#FFFFFF'
        smallCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height)
      }

      // @ts-ignore
      await info.page.render({ canvasContext: smallCtx, viewport: info.viewport }).promise

      // Draw onto mega centered horizontally or flush left? Let's do centered
      const offsetX = (chunkWidth - info.viewport.width) / 2
      megaCtx.drawImage(smallCanvas, offsetX, cursorY)
      cursorY += info.viewport.height

      smallCanvas.width = 0; smallCanvas.height = 0; // Free small
      
      globalProcessed++
      onProgress(Math.round((globalProcessed / totalPages) * 100))
      await new Promise(r => setTimeout(r, 10))
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      megaCanvas.toBlob((b) => b ? resolve(b) : reject(new Error('toBlob failed')), mimeType, options.quality)
    })

    results.push({
      pageNumber: chunkIdx + 1, // acts as "part"
      url: URL.createObjectURL(blob),
      blob,
      width: chunkWidth,
      height: chunkHeight
    })

    megaCanvas.width = 0; megaCanvas.height = 0;
  }

  return results
}
