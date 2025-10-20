import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { nanoid } from 'nanoid'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'pos-tenant-assets'

export interface UploadResult {
  url: string
  key: string
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'logos'
): Promise<UploadResult> {
  const fileExtension = fileName.split('.').pop()
  const uniqueFileName = `${folder}/${nanoid()}.${fileExtension}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: uniqueFileName,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read',
  })

  await s3Client.send(command)

  const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${uniqueFileName}`

  return {
    url,
    key: uniqueFileName,
  }
}

/**
 * Upload a base64 image to S3
 */
export async function uploadBase64ToS3(
  base64Data: string,
  folder: string = 'logos'
): Promise<UploadResult> {
  // Extract content type and data from base64 string
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)

  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string')
  }

  const contentType = matches[1]
  const base64Content = matches[2]
  const buffer = Buffer.from(base64Content, 'base64')

  // Determine file extension from content type
  const extension = contentType.split('/')[1] || 'png'
  const fileName = `image.${extension}`

  return uploadToS3(buffer, fileName, contentType, folder)
}

/**
 * Validate image file
 */
export function validateImage(base64Data: string): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)

  if (!matches || matches.length !== 3) {
    return { valid: false, error: 'Invalid image format' }
  }

  const contentType = matches[1]
  const base64Content = matches[2]

  if (!allowedTypes.includes(contentType)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' }
  }

  const buffer = Buffer.from(base64Content, 'base64')

  if (buffer.length > maxSize) {
    return { valid: false, error: 'Image size must be less than 5MB' }
  }

  return { valid: true }
}
