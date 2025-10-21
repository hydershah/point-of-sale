import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resetToTemplateDefaults } from '@/lib/features'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = params.id
    const result = await resetToTemplateDefaults(tenantId)
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to reset features' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset features error:', error)
    return NextResponse.json({ error: 'Failed to reset features' }, { status: 500 })
  }
}

