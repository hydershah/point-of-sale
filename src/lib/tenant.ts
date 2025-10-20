import { headers } from 'next/headers'
import { prisma } from './prisma'
import { cache } from 'react'

export interface TenantContext {
  id: string
  name: string
  subdomain: string
  status: string
  businessType: string
}

/**
 * Get the current subdomain from request headers
 */
export function getSubdomain(): string | null {
  const headersList = headers()
  const host = headersList.get('host') || ''
  
  // Handle localhost development
  if (host.includes('localhost')) {
    // Check for subdomain in localhost like tenant1.localhost:3000
    const parts = host.split('.')
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0]
    }
    // For testing, you can also use a header
    return headersList.get('x-tenant-subdomain') || null
  }
  
  // Production: extract subdomain from host
  const parts = host.split('.')
  if (parts.length >= 3) {
    const subdomain = parts[0]
    // Exclude www and admin subdomains
    if (subdomain === 'www' || subdomain === 'admin') {
      return null
    }
    return subdomain
  }
  
  return null
}

/**
 * Check if current request is for super admin
 */
export function isSuperAdminRequest(): boolean {
  const headersList = headers()
  const host = headersList.get('host') || ''
  
  if (host.includes('localhost')) {
    return headersList.get('x-super-admin') === 'true'
  }
  
  const subdomain = host.split('.')[0]
  return subdomain === 'admin'
}

/**
 * Get tenant by subdomain (cached)
 */
export const getTenantBySubdomain = cache(async (subdomain: string): Promise<TenantContext | null> => {
  try {
    const tenant = await prisma.tenants.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        businessType: true,
      },
    })

    if (!tenant) {
      return null
    }

    // Check if tenant is active
    if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
      return null
    }

    return tenant
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return null
  }
})

/**
 * Get current tenant context
 */
export async function getCurrentTenant(): Promise<TenantContext | null> {
  let subdomain = getSubdomain()

  // For localhost development without subdomain, default to 'demo'
  if (!subdomain) {
    const headersList = headers()
    const host = headersList.get('host') || ''
    if (host.includes('localhost')) {
      subdomain = 'demo'
    } else {
      return null
    }
  }

  return getTenantBySubdomain(subdomain)
}

/**
 * Prisma middleware to automatically filter by tenant
 * This should be used in API routes to ensure tenant isolation
 */
export function withTenantIsolation(tenantId: string) {
  return {
    tenantId,
  }
}

