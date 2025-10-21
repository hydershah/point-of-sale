import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isFeatureEnabled, checkFeatureAccess } from '@/lib/features'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { featureKey: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { featureKey } = params
    const enabled = await isFeatureEnabled(session.user.tenantId, featureKey)
    const access = await checkFeatureAccess(session.user.tenantId, featureKey)

    return NextResponse.json({
      enabled,
      canAccess: access.allowed,
      reason: access.reason,
    })
  } catch (error) {
    console.error('Error checking feature:', error)
    return NextResponse.json(
      { error: 'Failed to check feature' },
      { status: 500 }
    )
  }
}
