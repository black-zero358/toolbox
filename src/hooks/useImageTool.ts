/**
 * 图像处理核心 Hook
 * 负责管理文件队列、转换状态、配置选项，并调用底层转换引擎
 */
import { useState, useCallback, useEffect } from 'react'
import { convertRawImage, type ImageConvertOptions } from '../core/image-engine/imageWorker'
import { processPdfFile, type PdfConvertedPage } from '../core/image-engine/pdfWorker'
import { saveAs } from 'file-saver' // 用于在浏览器中触发文件下载

// 处理项的状态类型
export type ProcessItemStatus = 'idle' | 'processing' | 'done' | 'error'

// 处理项的数据接口
export interface AppProcessItem {
  id: string
  file: File                      // 原始文件对象
  type: 'image' | 'pdf'           // 文件类型
  status: ProcessItemStatus       // 当前状态
  progress: number                // 处理进度 (0-100)
  results: PdfConvertedPage[]     // 处理结果（如果是 PDF，可能对应多张图片）
  error?: string                  // 错误信息
}

export function useImageTool() {
  const [items, setItems] = useState<AppProcessItem[]>([]) // 文件队列状态
  const [isProcessing, setIsProcessing] = useState(false) // 是否正在处理全局队列
  const [options, setOptions] = useState<ImageConvertOptions & { scale: number, stitchLongImage?: boolean }>({
    format: 'webp',
    quality: 0.85,
    scale: 2 // 仅用于 PDF 渲染倍率
  })

  /**
   * 自动清理内存中的 Object URL
   * 知识点：URL.createObjectURL 创建的临时 URL 会占用内存，
   * 必须在组件卸载或文件删除时显式调用 URL.revokeObjectURL 释放，
   * 否则大量处理图片会导致页面内存崩溃 (OOM)。
   */
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

  // 向队列添加文件
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

  // 从队列移除文件并清理相关内存
  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id)
      if (item) {
        item.results.forEach(res => URL.revokeObjectURL(res.url))
      }
      return prev.filter(i => i.id !== id)
    })
  }, [])

  // 清空所有文件
  const clearAllItems = useCallback(() => {
    items.forEach(item => {
      item.results.forEach(res => URL.revokeObjectURL(res.url))
    })
    setItems([])
  }, [items])

  /**
   * 处理全部文件
   * 采用异步循环 (for...of) 串行处理，避免同时开启大量转换导致浏览器卡死或崩溃
   */
  const processAll = useCallback(async () => {
    const pendingItems = items.filter(i => i.status === 'idle' || i.status === 'error')
    if (pendingItems.length === 0) return

    setIsProcessing(true)

    // 逐个处理待命中的文件
    for (const pending of pendingItems) {
      // 更新当前文件状态为“处理中”
      setItems(prev => prev.map(i => i.id === pending.id ? { ...i, status: 'processing', progress: 0, error: undefined } : i))

      try {
        if (pending.type === 'image') {
          // 调用图片转换引擎
          const res = await convertRawImage(pending.file, options)
          setItems(prev => prev.map(i => i.id === pending.id ? {
            ...i,
            status: 'done',
            progress: 100,
            results: [{ pageNumber: 1, url: res.url, blob: res.blob, width: res.width, height: res.height }]
          } : i))
        } else if (pending.type === 'pdf') {
          // 调用 PDF 渲染引擎
          const results = await processPdfFile(pending.file, options, (prog) => {
            // 通过回调更新 PDF 的分步处理进度
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
        // 如果出错，记录错误信息
        setItems(prev => prev.map(i => i.id === pending.id ? { ...i, status: 'error', error: err.message || 'Unknown error' } : i))
      }
    }

    setIsProcessing(false)
  }, [items, options])

  const [predictedSize, setPredictedSize] = useState<number | null>(null)

  /**
   * 预测产出体积
   * 使用防抖 (Debounce) 机制，在用户停止调整选项 500ms 后计算一次，避免频繁触发转换测试
   */
  useEffect(() => {
    let active = true
    const calculatePrediction = async () => {
      const idleItems = items.filter(i => i.status === 'idle')
      if (idleItems.length === 0) {
        setPredictedSize(null)
        return
      }
      
      const totalIdleSize = idleItems.reduce((acc, i) => acc + i.file.size, 0)
      
      // 算法：取队列中第一个文件进行“试转换”，算出压缩比，以此推算总体的体积
      const firstImage = idleItems.find(i => i.type === 'image')
      let ratio = 1
      if (firstImage) {
        try {
          const res = await convertRawImage(firstImage.file, options)
          ratio = res.blob.size / firstImage.file.size
          if (res.url) URL.revokeObjectURL(res.url) // 立刻销毁试转换生成的图
        } catch {
          // 容错估算法
          ratio = options.quality * (options.format === 'webp' ? 0.6 : 0.8)
        }
      } else {
        ratio = options.quality * (options.format === 'webp' ? 0.6 : 0.8)
      }
      
      if (active) {
        setPredictedSize(totalIdleSize * ratio)
      }
    }
    
    // 设置 500ms 计时器实现防抖
    const tid = setTimeout(calculatePrediction, 500)
    return () => {
      active = false
      clearTimeout(tid)
    }
  }, [items, options])

  /**
   * 批量下载结果
   * 利用 file-saver 库，循环触发浏览器的文件保存弹窗
   */
  const downloadAll = useCallback(async () => {
    const doneItems = items.filter(i => i.status === 'done' && i.results.length > 0)
    if (doneItems.length === 0) return

    for (const item of doneItems) {
      const originalName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name
      if (item.results.length === 1) {
        saveAs(item.results[0].blob, `${originalName}-converted.${options.format}`)
      } else {
        // PDF 转换出的多张图片
        item.results.forEach(res => {
          saveAs(res.blob, `${originalName}_page-${res.pageNumber}.${options.format}`)
        })
      }
      // 间隔 200ms 触发一次，防止浏览器阻止过快的连环下载弹窗
      await new Promise(r => setTimeout(r, 200))
    }
  }, [items, options.format])

  return {
    items,
    options,
    setOptions,
    isProcessing,
    predictedSize,
    addFiles,
    removeItem,
    clearAllItems,
    processAll,
    downloadAll
  }
}
