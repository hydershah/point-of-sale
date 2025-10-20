// Real-time inventory alert system
import { prisma } from '@/lib/prisma'
import { AlertStatus } from '@prisma/client'

// Check if product stock is below threshold and create alert
export async function checkInventoryLevel(
  tenantId: string,
  productId: string
): Promise<void> {
  try {
    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockAlert: true,
        trackStock: true,
      },
    })

    if (!product || !product.trackStock || !product.lowStockAlert) {
      return
    }

    // Check if stock is below threshold
    if (product.stock <= product.lowStockAlert) {
      // Check if alert already exists and is pending
      const existingAlert = await prisma.inventory_alerts.findFirst({
        where: {
          tenantId,
          productId,
          status: AlertStatus.PENDING,
        },
      })

      if (!existingAlert) {
        // Create new alert
        await prisma.inventory_alerts.create({
          data: {
            tenantId,
            productId,
            productName: product.name,
            currentStock: product.stock,
            threshold: product.lowStockAlert,
            status: AlertStatus.PENDING,
          },
        })

        // TODO: Send real-time notification via Socket.IO or push notification
        console.log(`Low stock alert created for ${product.name}`)
      } else {
        // Update existing alert with new stock level
        await prisma.inventory_alerts.update({
          where: { id: existingAlert.id },
          data: { currentStock: product.stock },
        })
      }
    } else {
      // Stock is above threshold, resolve any pending alerts
      await prisma.inventory_alerts.updateMany({
        where: {
          tenantId,
          productId,
          status: AlertStatus.PENDING,
        },
        data: {
          status: AlertStatus.RESOLVED,
          resolvedAt: new Date(),
        },
      })
    }
  } catch (error) {
    console.error('Error checking inventory level:', error)
  }
}

// Check all products for low stock
export async function checkAllInventoryLevels(tenantId: string): Promise<void> {
  try {
    const products = await prisma.products.findMany({
      where: {
        tenantId,
        trackStock: true,
        lowStockAlert: { not: null },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockAlert: true,
      },
    })

    for (const product of products) {
      await checkInventoryLevel(tenantId, product.id)
    }
  } catch (error) {
    console.error('Error checking all inventory levels:', error)
  }
}

// Get pending alerts for tenant
export async function getPendingAlerts(tenantId: string) {
  return prisma.inventory_alerts.findMany({
    where: {
      tenantId,
      status: AlertStatus.PENDING,
    },
    orderBy: { createdAt: 'desc' },
  })
}

// Get all alerts with filters
export async function getInventoryAlerts(
  tenantId: string,
  filters?: {
    status?: AlertStatus
    productId?: string
    limit?: number
  }
) {
  const where: any = { tenantId }

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.productId) {
    where.productId = filters.productId
  }

  return prisma.inventory_alerts.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 50,
  })
}

// Acknowledge an alert
export async function acknowledgeAlert(
  alertId: string,
  userId: string,
  userName: string
): Promise<void> {
  await prisma.inventory_alerts.update({
    where: { id: alertId },
    data: {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedBy: userName,
      acknowledgedAt: new Date(),
    },
  })
}

// Resolve an alert
export async function resolveAlert(alertId: string): Promise<void> {
  await prisma.inventory_alerts.update({
    where: { id: alertId },
    data: {
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date(),
    },
  })
}

// Get alert statistics
export async function getAlertStatistics(tenantId: string) {
  const [pending, acknowledged, resolved, total] = await Promise.all([
    prisma.inventory_alerts.count({
      where: { tenantId, status: AlertStatus.PENDING },
    }),
    prisma.inventory_alerts.count({
      where: { tenantId, status: AlertStatus.ACKNOWLEDGED },
    }),
    prisma.inventory_alerts.count({
      where: { tenantId, status: AlertStatus.RESOLVED },
    }),
    prisma.inventory_alerts.count({ where: { tenantId } }),
  ])

  return {
    pending,
    acknowledged,
    resolved,
    total,
  }
}

// Get critical products (very low stock)
export async function getCriticalProducts(tenantId: string) {
  const products = await prisma.products.findMany({
    where: {
      tenantId,
      trackStock: true,
      lowStockAlert: { not: null },
    },
    select: {
      id: true,
      name: true,
      stock: true,
      lowStockAlert: true,
    },
  })

  // Filter products where stock is 50% or less of threshold
  return products.filter((product) => {
    if (!product.lowStockAlert) return false
    return product.stock <= product.lowStockAlert * 0.5
  })
}

// Auto-create alerts for products after stock update
export async function handleStockUpdate(
  tenantId: string,
  productId: string,
  oldStock: number,
  newStock: number
): Promise<void> {
  // Only check if stock decreased
  if (newStock < oldStock) {
    await checkInventoryLevel(tenantId, productId)
  }

  // If stock increased significantly, resolve pending alerts
  if (newStock > oldStock) {
    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { lowStockAlert: true },
    })

    if (product?.lowStockAlert && newStock > product.lowStockAlert) {
      await prisma.inventory_alerts.updateMany({
        where: {
          tenantId,
          productId,
          status: { in: [AlertStatus.PENDING, AlertStatus.ACKNOWLEDGED] },
        },
        data: {
          status: AlertStatus.RESOLVED,
          resolvedAt: new Date(),
        },
      })
    }
  }
}
