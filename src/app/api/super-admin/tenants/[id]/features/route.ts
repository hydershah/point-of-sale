import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantFeatures, enableFeature, disableFeature, resetToTemplateDefaults } from '@/lib/features'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = params.id
    const features = await getTenantFeatures(tenantId)
    return NextResponse.json(features)
  } catch (error) {
    console.error('Super-admin GET features error:', error)
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 })
  }
}

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
    const body = await req.json().catch(() => ({}))
    const { action, featureKey } = body as { action?: string; featureKey?: string }

    if (action === 'reset') {
      const result = await resetToTemplateDefaults(tenantId)
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Failed to reset features' }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    if (!featureKey || !['enable', 'disable'].includes(action || '')) {
      return NextResponse.json({ error: 'Invalid action or featureKey' }, { status: 400 })
    }

    if (action === 'enable') {
      const result = await enableFeature(tenantId, featureKey, session.user.id)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'disable') {
      const result = await disableFeature(tenantId, featureKey, session.user.id)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Super-admin POST features error:', error)
    return NextResponse.json({ error: 'Failed to modify features' }, { status: 500 })
  }
}

