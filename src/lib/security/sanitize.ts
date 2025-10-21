// Input sanitization to prevent XSS and injection attacks
// TODO: Install isomorphic-dompurify package for proper sanitization
// import DOMPurify from 'isomorphic-dompurify'

// Sanitize HTML content
export function sanitizeHtml(dirty: string): string {
  // return DOMPurify.sanitize(dirty, {
  //   ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  //   ALLOWED_ATTR: ['href'],
  // })
  // Temporary: basic HTML entity encoding until DOMPurify is installed
  return dirty
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// Sanitize plain text (remove HTML tags)
export function sanitizeText(input: string): string {
  // return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
  // Temporary: basic HTML entity encoding until DOMPurify is installed
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeText(value) as T[keyof T]
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value) as T[keyof T]
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map((item) =>
        typeof item === 'string' ? sanitizeText(item) : item
      ) as T[keyof T]
    } else {
      sanitized[key as keyof T] = value
    }
  }

  return sanitized
}

// Validate and sanitize email
export function sanitizeEmail(email: string): string {
  const sanitized = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format')
  }

  return sanitized
}

// Validate and sanitize phone number
export function sanitizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  if (digits.length < 10 || digits.length > 15) {
    throw new Error('Invalid phone number')
  }

  return digits
}

// Sanitize SQL input (basic prevention)
export function sanitizeSqlInput(input: string): string {
  // Remove potentially dangerous SQL characters
  return input.replace(/['";\\]/g, '')
}

// Validate and sanitize URL
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol')
    }

    return parsed.toString()
  } catch {
    throw new Error('Invalid URL format')
  }
}

// Sanitize filename to prevent path traversal
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .substring(0, 255)
}

// Validate and sanitize numeric input
export function sanitizeNumber(input: string | number, options?: {
  min?: number
  max?: number
  allowNegative?: boolean
  allowDecimal?: boolean
}): number {
  const num = typeof input === 'string' ? parseFloat(input) : input

  if (isNaN(num)) {
    throw new Error('Invalid number')
  }

  if (options?.allowNegative === false && num < 0) {
    throw new Error('Negative numbers not allowed')
  }

  if (options?.allowDecimal === false && !Number.isInteger(num)) {
    throw new Error('Decimal numbers not allowed')
  }

  if (options?.min !== undefined && num < options.min) {
    throw new Error(`Number must be at least ${options.min}`)
  }

  if (options?.max !== undefined && num > options.max) {
    throw new Error(`Number must be at most ${options.max}`)
  }

  return num
}

// Escape special characters for regex
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
