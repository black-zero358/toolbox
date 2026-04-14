import { useState, useCallback, useEffect } from 'react'
import { convertRawImage, type ImageConvertOptions } from '../core/image-engine/imageWorker'
import { processPdfFile, type PdfConvertedPage } from '../core/image-engine/pdfWorker'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export type ProcessItemStatus = 'idle' | 'processing' | 'done' | 'error'

export interface AppProcessItem {
  id: string
  file: File
  type: 'image' | 'pdf'
  status: ProcessItemStatus
  progress: number // 0-100
  results: PdfConvertedPage[] // For images, length will be 1
  error?: string
}

export function useImageTool() {
  const [items, setItems] = useState<AppProcessItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [options, setOptions] = useState<ImageConvertOptions & { scale: number }>({
    format: 'webp',
    quality: 0.85,
    scale: 2 // Only for PDF rendering
  })

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      items.forEach(item => {
        item.results.forEach(res => {
          if (res.url) URL.revokeObjectURL(res.url)
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems = Array.from(files).map((file) => {
      const type: 'pdf' | 'image' = file.type === 'application/pdf' ? 'pdf' : 'image'
      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        type,
        status: 'idle' as ProcessItemStatus,
        progress: 0,
        results: []
      }
    })
    setItems(prev => [...prev, ...newItems])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id)
      if (item) {
        item.results.forEach(res => URL.revokeObjectURL(res.url))
      }
      return prev.filter(i => i.id !== id)
    })
  }, [])

  const clearAllItems = useCallback(() => {
    items.forEach(item => {
      item.results.forEach(res => URL.revokeObjectURL(res.url))
    })
    setItems([])
  }, [items])

  const processAll = useCallback(async () => {
    const pendingItems = items.filter(i => i.status === 'idle' || i.status === 'error')
    if (pendingItems.length === 0) return

    setIsProcessing(true)

    // Using a for loop to process sequentially to avoid blocking the main thread entirely and OOM
    for (const pending of pendingItems) {
      setItems(prev => prev.map(i => i.id === pending.id ? { ...i, status: 'processing', progress: 0, error: undefined } : i))

      try {
        if (pending.type === 'image') {
          const res = await convertRawImage(pending.file, options)
          setItems(prev => prev.map(i => i.id === pending.id ? {
            ...i,
            status: 'done',
            progress: 100,
            results: [{ pageNumber: 1, url: res.url, blob: res.blob, width: res.width, height: res.height }]
          } : i))
        } else if (pending.type === 'pdf') {
          const results = await processPdfFile(pending.file, options, (prog) => {
            setItems(prev => prev.map(i => i.id === pending.id ? { ...i, progress: prog } : i))
          })
          setItems(prev => prev.map(i => i.id === pending.id ? {
            ...i,
            status: 'done',
            progress: 100,
            results
          } : i))
        }
      } catch (err: any) {
        setItems(prev => prev.map(i => i.id === pending.id ? { ...i, status: 'error', error: err.message || 'Unknown error' } : i))
      }
    }

    setIsProcessing(false)
  }, [items, options])

  const downloadAll = useCallback(async () => {
    const doneItems = items.filter(i => i.status === 'done' && i.results.length > 0)
    if (doneItems.length === 0) return

    // If exactly one image is generated from one item
    if (doneItems.length === 1 && doneItems[0].results.length === 1) {
      const single = doneItems[0].results[0]
      const originalName = doneItems[0].file.name.substring(0, doneItems[0].file.name.lastIndexOf('.')) || doneItems[0].file.name
      saveAs(single.blob, `${originalName}-converted.${options.format}`)
      return
    }

    // Multiple images -> Zip
    const zip = new JSZip()
    const folder = zip.folder(`converted_images`)
    if (!folder) return

    doneItems.forEach(item => {
      const originalName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name
      if (item.results.length === 1) {
        folder.file(`${originalName}.${options.format}`, item.results[0].blob)
      } else {
        item.results.forEach(res => {
          folder.file(`${originalName}_page-${res.pageNumber}.${options.format}`, res.blob)
        })
      }
    })

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `toolbox-converted-images.zip`)
  }, [items, options.format])

  return {
    items,
    options,
    setOptions,
    isProcessing,
    addFiles,
    removeItem,
    clearAllItems,
    processAll,
    downloadAll
  }
}
