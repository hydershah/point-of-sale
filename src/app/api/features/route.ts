import { NextResponse } from 'next/server'
import { getFeatureCatalog } from '@/lib/features'

export async function GET() {
  try {
    const catalog = await getFeatureCatalog()
    return NextResponse.json(catalog)
  } catch (error) {
    console.error('Error fetching feature catalog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feature catalog' },
      { status: 500 }
    )
  }
}
