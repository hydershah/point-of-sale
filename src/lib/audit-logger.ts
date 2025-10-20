// Audit logging system for compliance and security
import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

interface AuditLogData {
  tenantId: string
  userId?: string
  userEmail?: string
  userName?: string
  action: AuditAction
  entity: string
  entityId?: string
  description: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

// Create an audit log entry
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        description: data.description,
        metadata: data.metadata || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging should not break the main operation
  }
}

// Log product changes
export async function logProductChange(
  tenantId: string,
  userId: string,
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  productId: string,
  productName: string,
  changes?: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    tenantId,
    userId,
    userName,
    action: action as AuditAction,
    entity: 'Product',
    entityId: productId,
    description: `${action.toLowerCase()}d product: ${productName}`,
    metadata: changes,
    ipAddress,
  })
}

// Log order changes
export async function logOrderChange(
  tenantId: string,
  userId: string,
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  orderId: string,
  orderNumber: number,
  changes?: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    tenantId,
    userId,
    userName,
    action: action as AuditAction,
    entity: 'Order',
    entityId: orderId,
    description: `${action.toLowerCase()}d order #${orderNumber}`,
    metadata: changes,
    ipAddress,
  })
}

// Log payment transactions
export async function logPayment(
  tenantId: string,
  userId: string,
  userName: string,
  orderId: string,
  amount: number,
  method: string,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    tenantId,
    userId,
    userName,
    action: 'PAYMENT',
    entity: 'Payment',
    entityId: orderId,
    description: `Processed ${method} payment of $${amount.toFixed(2)}`,
    metadata: { amount, method },
    ipAddress,
  })
}

// Log refunds
export async function logRefund(
  tenantId: string,
  userId: string,
  userName: string,
  orderId: string,
  amount: number,
  reason?: string,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    tenantId,
    userId,
    userName,
    action: 'REFUND',
    entity: 'Order',
    entityId: orderId,
    description: `Issued refund of $${amount.toFixed(2)}`,
    metadata: { amount, reason },
    ipAddress,
  })
}

// Log user authentication
export async function logLogin(
  tenantId: string,
  userId: string,
  userEmail: string,
  userName: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    tenantId,
    userId,
    userEmail,
    userName,
    action: 'LOGIN',
    entity: 'User',
    entityId: userId,
    description: `User logged in`,
    ipAddress,
    userAgent,
  })
}

export async function logLogout(
  tenantId: string,
  userId: string,
  userName: string,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    tenantId,
    userId,
    userName,
    action: 'LOGOUT',
    entity: 'User',
    entityId: userId,
    description: `User logged out`,
    ipAddress,
  })
}

// Log customer changes
export async function logCustomerChange(
  tenantId: string,
  userId: string,
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  customerId: string,
  customerName: string,
  changes?: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    tenantId,
    userId,
    userName,
    action: action as AuditAction,
    entity: 'Customer',
    entityId: customerId,
    description: `${action.toLowerCase()}d customer: ${customerName}`,
    metadata: changes,
    ipAddress,
  })
}

// Log settings changes
export async function logSettingsChange(
  tenantId: string,
  userId: string,
  userName: string,
  changes: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    tenantId,
    userId,
    userName,
    action: 'UPDATE',
    entity: 'Settings',
    description: `Updated tenant settings`,
    metadata: changes,
    ipAddress,
  })
}

// Get audit logs with filters
export async function getAuditLogs(
  tenantId: string,
  filters?: {
    userId?: string
    action?: AuditAction
    entity?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }
) {
  const where: any = { tenantId }

  if (filters?.userId) {
    where.userId = filters.userId
  }

  if (filters?.action) {
    where.action = filters.action
  }

  if (filters?.entity) {
    where.entity = filters.entity
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 100,
  })
}
