import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantFeatures, enableFeature, disableFeature, resetToTemplateDefaults } from '@/lib/features'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const features = await getTenantFeatures(session.user.tenantId)
    return NextResponse.json(features)
  } catch (error) {
    console.error('Error fetching tenant features:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenant features' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only BUSINESS_ADMIN can modify features
    if (session.user.role !== 'BUSINESS_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, featureKey } = body

    if (action === 'enable') {
      const result = await enableFeature(
        session.user.tenantId,
        featureKey,
        session.user.id
      )
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    } else if (action === 'disable') {
      const result = await disableFeature(
        session.user.tenantId,
        featureKey,
        session.user.id
      )
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    } else if (action === 'reset') {
      const result = await resetToTemplateDefaults(session.user.tenantId)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error modifying tenant features:', error)
    return NextResponse.json(
      { error: 'Failed to modify tenant features' },
      { status: 500 }
    )
  }
}
