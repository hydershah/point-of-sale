import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { initializeTenantFeatures, resetToTemplateDefaults } from '@/lib/features'

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
    const { templateId, typeKey, initialize = false, reset = false } = body as {
      templateId?: string
      typeKey?: string
      initialize?: boolean
      reset?: boolean
    }

    let targetTemplateId = templateId
    if (!targetTemplateId && typeKey) {
      const template = await prisma.business_type_templates.findUnique({ where: { typeKey } })
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      targetTemplateId = template.id
    }

    if (!targetTemplateId) {
      return NextResponse.json({ error: 'templateId or typeKey is required' }, { status: 400 })
    }

    // Assign template to tenant
    await prisma.tenants.update({
      where: { id: tenantId },
      data: { businessTemplateId: targetTemplateId, updatedAt: new Date() },
    })

    if (initialize) {
      await initializeTenantFeatures(tenantId, targetTemplateId)
    }

    if (reset) {
      const result = await resetToTemplateDefaults(tenantId)
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Failed to reset features' }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Assign template error:', error)
    return NextResponse.json({ error: 'Failed to assign template' }, { status: 500 })
  }
}

