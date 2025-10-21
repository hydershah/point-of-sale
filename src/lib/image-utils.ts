// Image optimization utilities
// TODO: Install sharp package for image optimization
// import sharp from 'sharp'

export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
}

// Optimize image buffer
// TODO: Uncomment when sharp is installed
export async function optimizeImage(
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> {
  // const {
  //   width,
  //   height,
  //   quality = 80,
  //   format = 'webp',
  // } = options

  // let image = sharp(buffer)

  // // Resize if dimensions provided
  // if (width || height) {
  //   image = image.resize(width, height, {
  //     fit: 'inside',
  //     withoutEnlargement: true,
  //   })
  // }

  // // Convert to specified format with quality
  // switch (format) {
  //   case 'webp':
  //     image = image.webp({ quality })
  //     break
  //   case 'jpeg':
  //     image = image.jpeg({ quality, progressive: true })
  //     break
  //   case 'png':
  //     image = image.png({ quality, progressive: true })
  //     break
  // }

  // return image.toBuffer()
  throw new Error('Sharp package not installed. Image optimization is not available.')
}

// Generate multiple image sizes (thumbnails)
export async function generateImageVariants(
  buffer: Buffer,
  variants: { name: string; width: number; height?: number }[]
): Promise<Record<string, Buffer>> {
  const results: Record<string, Buffer> = {}

  for (const variant of variants) {
    const optimized = await optimizeImage(buffer, {
      width: variant.width,
      height: variant.height,
      format: 'webp',
    })

    results[variant.name] = optimized
  }

  return results
}

// Standard image variants for products
export const PRODUCT_IMAGE_VARIANTS = [
  { name: 'thumbnail', width: 150, height: 150 },
  { name: 'small', width: 300, height: 300 },
  { name: 'medium', width: 600, height: 600 },
  { name: 'large', width: 1200, height: 1200 },
]

// Get image dimensions
// TODO: Uncomment when sharp is installed
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  // const metadata = await sharp(buffer).metadata()
  // return {
  //   width: metadata.width || 0,
  //   height: metadata.height || 0,
  // }
  throw new Error('Sharp package not installed. Image dimension detection is not available.')
}

// Validate image file
export function validateImageFile(file: File): {
  valid: boolean
  error?: string
} {
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.',
    }
  }

  return { valid: true }
}

// Convert File to Buffer (for server-side processing)
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// Generate blurhash placeholder
export async function generateBlurhash(buffer: Buffer): Promise<string> {
  // This would use the blurhash library
  // For now, return a default hash
  return 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH'
}

// Image URL helpers
export function getImageUrl(path: string, variant?: string): string {
  if (!path) return '/images/placeholder.png'

  // If it's already a full URL, return as-is
  if (path.startsWith('http')) return path

  // If variant specified, modify the path
  if (variant && variant !== 'original') {
    const ext = path.substring(path.lastIndexOf('.'))
    const base = path.substring(0, path.lastIndexOf('.'))
    return `${base}-${variant}${ext}`
  }

  return path
}

// Progressive image loading
export function getImageSrcSet(path: string): string {
  if (!path || path.startsWith('http')) return ''

  return `
    ${getImageUrl(path, 'small')} 300w,
    ${getImageUrl(path, 'medium')} 600w,
    ${getImageUrl(path, 'large')} 1200w
  `
}

// Get optimal image format based on browser support
export function getOptimalImageFormat(
  userAgent: string
): 'webp' | 'jpeg' {
  // Check if browser supports WebP
  const supportsWebP = /Chrome|Firefox|Edge|Opera/.test(userAgent)
  return supportsWebP ? 'webp' : 'jpeg'
}
