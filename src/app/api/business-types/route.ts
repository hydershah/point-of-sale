import { NextResponse } from 'next/server'
import { getBusinessTypeTemplates } from '@/lib/features'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if we're in a build environment without database access
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not available, returning empty array')
      return NextResponse.json([])
    }

    const templates = await getBusinessTypeTemplates()
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching business type templates:', error)

    // Return empty array instead of error during build to prevent build failures
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return NextResponse.json([])
    }

    return NextResponse.json(
      { error: 'Failed to fetch business type templates' },
      { status: 500 }
    )
  }
}
