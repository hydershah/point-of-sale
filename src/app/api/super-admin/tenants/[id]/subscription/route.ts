import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
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
    const { plan, status, amount, interval } = body as {
      plan?: 'BASIC' | 'PRO' | 'ENTERPRISE'
      status?: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING'
      amount?: number
      interval?: string
    }

    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
      select: { subscriptionId: true },
    })
    if (!tenant || !tenant.subscriptionId) {
      return NextResponse.json({ error: 'Tenant has no subscription' }, { status: 400 })
    }

    const data: any = { updatedAt: new Date() }
    if (plan) data.plan = plan
    if (status) data.status = status
    if (typeof amount === 'number') data.amount = amount
    if (interval) data.interval = interval

    const updated = await prisma.subscriptions.update({
      where: { id: tenant.subscriptionId },
      data,
      select: { id: true, plan: true, status: true, amount: true, interval: true },
    })

    return NextResponse.json({ success: true, subscription: updated })
  } catch (error) {
    console.error('Update subscription error:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}

