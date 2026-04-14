/**
 * PDF 转换引擎
 * 使用 pdfjs-dist 库在浏览器中解析 PDF 文件并将其渲染为图片
 */
import * as pdfjsLib from 'pdfjs-dist'

export interface PdfConvertOptions {
  format: 'webp' | 'jpeg' | 'png'
  quality: number
  scale: number             // 渲染像素倍率 (DPI 缩放)
  maxWidth?: number         // 最大宽度限制
  stitchLongImage?: boolean // 是否拼接为长图
}

export interface PdfConvertedPage {
  pageNumber: number // 对应页码（或在长图模式中的分段序号）
  url: string
  blob: Blob
  width: number
  height: number
}

// 必须正确配置 PDF.js 的 Worker 路径，否则无法解析 PDF
// 这里利用 Vite 的 URL 构造函数指向 node_modules 中的 worker 文件
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

// 浏览器 Canvas 的最大高度限制（约 3w 像素），超过此值可能报错或黑屏
const MAX_CANVAS_HEIGHT = 30000 

/**
 * 处理 PDF 文件转换的核心函数
 */
export async function processPdfFile(
  file: File,
  options: PdfConvertOptions,
  onProgress: (percent: number) => void
): Promise<PdfConvertedPage[]> {
  // 1. 加载 PDF 文档
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdfDoc = await loadingTask.promise

  const totalPages = pdfDoc.numPages
  const results: PdfConvertedPage[] = []
  const mimeType = `image/${options.format}`

  // 模式 A：标准模式（每一页转为一张独立图片）
  if (!options.stitchLongImage) {
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfDoc.getPage(i) // 获取特定页码的对象
      let viewport = page.getViewport({ scale: options.scale }) // 计算渲染视野
      
      // 如果超过最大宽度限制，则重新计算视野缩放
      if (options.maxWidth && viewport.width > options.maxWidth) {
        const ratio = options.maxWidth / viewport.width
        viewport = page.getViewport({ scale: options.scale * ratio })
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context error')

      canvas.width = viewport.width
      canvas.height = viewport.height

      // 处理透明度
      if (options.format !== 'png') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // 2. 将 PDF 页面渲染到 Canvas 上
      // @ts-ignore
      await page.render({ canvasContext: ctx, viewport }).promise

      // 3. 导出为 Blob
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
      
      canvas.width = 0; canvas.height = 0; // 手动清理 canvas 绘图缓存
      onProgress(Math.round((i / totalPages) * 100)) // 通知外部进度
      await new Promise(r => setTimeout(r, 10)) // 短暂让出主线程
    }
    return results
  }

  // 模式 B：长图拼接模式
  // 第一步：收集所有页面的尺寸信息
  const pagesInfo = []
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i)
    let viewport = page.getViewport({ scale: options.scale })
    if (options.maxWidth && viewport.width > options.maxWidth) {
      viewport = page.getViewport({ scale: options.scale * (options.maxWidth / viewport.width) })
    }
    pagesInfo.push({ page, viewport, originalIndex: i })
  }

  // 第二步：根据高度限制进行分段（Chunking）
  // 浏览器 Canvas 有最大高度，所以超长 PDF 会被切成几段长图
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

  // 第三步：渲染每一个分段的“巨型 Canvas”
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
      // 这里的策略是先渲染小页 Canvas，再画到巨型 Canvas 上，这样定位更稳定
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

      // 将渲染好的页面绘制到长图的对应纵坐标位置
      const offsetX = (chunkWidth - info.viewport.width) / 2 // 居中对齐
      megaCtx.drawImage(smallCanvas, offsetX, cursorY)
      cursorY += info.viewport.height

      smallCanvas.width = 0; smallCanvas.height = 0; // 清理
      
      globalProcessed++
      onProgress(Math.round((globalProcessed / totalPages) * 100))
      await new Promise(r => setTimeout(r, 10))
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      megaCanvas.toBlob((b) => b ? resolve(b) : reject(new Error('toBlob failed')), mimeType, options.quality)
    })

    results.push({
      pageNumber: chunkIdx + 1,
      url: URL.createObjectURL(blob),
      blob,
      width: chunkWidth,
      height: chunkHeight
    })

    megaCanvas.width = 0; megaCanvas.height = 0;
  }

  return results
}
