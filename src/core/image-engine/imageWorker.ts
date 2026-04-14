/**
 * 图像转换引擎
 * 利用浏览器内置的 Canvas API 进行图像的像素级处理
 */
export interface ImageConvertOptions {
  format: 'webp' | 'jpeg' | 'png' // 目标格式
  quality: number                   // 质量压缩比 (0-1)
  maxWidth?: number                // 最大宽度限制
}

/**
 * 将原始 File 对象转换为目标格式的 Blob 和 URL
 */
export async function convertRawImage(file: File, options: ImageConvertOptions): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // 1. 创建一个 HTMLImageElement 加载图片
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    
    img.onload = () => {
      // 图片加载成功后，清理原始临时 URL
      URL.revokeObjectURL(objectUrl)
      
      // 2. 创建离屏 Canvas 用于绘图
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // 根据 options.maxWidth 计算缩放比例
      if (options.maxWidth && width > options.maxWidth) {
        const ratio = options.maxWidth / width
        width = options.maxWidth
        height = height * ratio
      }

      // 确保宽高不为 0
      canvas.width = Math.max(1, width)
      canvas.height = Math.max(1, height)

      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Failed to get 2d context'))

      /**
       * 细节处理：
       * 如果转换目标是 JPEG，因为 JPEG 不支持透明通道，
       * 默认透明部分会变黑。所以我们手动填充一层白色背景。
       */
      if (options.format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // 3. 将图片绘制到 Canvas 上（此过程会根据 Canvas 尺寸自动缩放）
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // 4. 将 Canvas 内容导出为目标格式的 Blob
      const mimeType = `image/${options.format}`
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'))
          resolve({
            blob,
            url: URL.createObjectURL(blob), // 生成处理后的临时浏览地址
            width: canvas.width,
            height: canvas.height
          })
        },
        mimeType,
        options.quality // 传入压缩质量参数
      )
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image file'))
    }
    img.src = objectUrl
  })
}
