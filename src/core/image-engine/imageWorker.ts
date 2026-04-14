export interface ImageConvertOptions {
  format: 'webp' | 'jpeg' | 'png'
  quality: number
  maxWidth?: number
}

export async function convertRawImage(file: File, options: ImageConvertOptions): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (options.maxWidth && width > options.maxWidth) {
        const ratio = options.maxWidth / width
        width = options.maxWidth
        height = height * ratio
      }

      canvas.width = Math.max(1, width)
      canvas.height = Math.max(1, height)

      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Failed to get 2d context'))

      // If converting to JPEG, fill white background to prevent transparent to black issue
      if (options.format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const mimeType = `image/${options.format}`
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'))
          resolve({
            blob,
            url: URL.createObjectURL(blob),
            width: canvas.width,
            height: canvas.height
          })
        },
        mimeType,
        options.quality
      )
    }
    
    img.onerror = () => reject(new Error('Failed to load image file'))
    img.src = objectUrl
  })
}
