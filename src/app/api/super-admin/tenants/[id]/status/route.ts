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
    const { status } = body as { status?: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' }

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    }

    const updated = await prisma.tenants.update({
      where: { id: tenantId },
      data: { status, updatedAt: new Date() },
      select: { id: true, status: true },
    })

    return NextResponse.json({ success: true, tenant: updated })
  } catch (error) {
    console.error('Update tenant status error:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}

