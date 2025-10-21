import { NextResponse } from 'next/server'
import { getBusinessTypeTemplates } from '@/lib/features'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const templates = await getBusinessTypeTemplates()
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching business type templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business type templates' },
      { status: 500 }
    )
  }
}
