import { NextResponse } from 'next/server'
import { getFeatureCatalog } from '@/lib/features'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if we're in a build environment without database access
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not available, returning empty object')
      return NextResponse.json({})
    }

    const catalog = await getFeatureCatalog()
    return NextResponse.json(catalog)
  } catch (error) {
    console.error('Error fetching feature catalog:', error)

    // Return empty object instead of error during build to prevent build failures
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return NextResponse.json({})
    }

    return NextResponse.json(
      { error: 'Failed to fetch feature catalog' },
      { status: 500 }
    )
  }
}
