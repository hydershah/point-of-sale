// Real-time sales monitoring dashboard
import { io, Socket } from 'socket.io-client'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export interface RealtimeSalesMetrics {
  todaySales: number
  todayOrders: number
  todayRevenue: number
  activeOrders: number
  averageOrderValue: number
  topSellingProduct?: {
    name: string
    quantity: number
  }
  salesByHour: Array<{
    hour: number
    revenue: number
    orders: number
  }>
  recentOrders: Array<{
    id: string
    orderNumber: number
    total: number
    status: OrderStatus
    createdAt: Date
  }>
}

// Socket connection for real-time updates
let dashboardSocket: Socket | null = null

// Initialize real-time dashboard
export function initializeRealtimeDashboard(tenantId: string): Socket {
  if (dashboardSocket?.connected) {
    return dashboardSocket
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'

  dashboardSocket = io(socketUrl, {
    path: process.env.NEXT_PUBLIC_SOCKET_IO_PATH || '/socket.io',
    transports: ['websocket', 'polling'],
    auth: {
      tenantId,
    },
  })

  dashboardSocket.on('connect', () => {
    console.log('[Dashboard] Connected to real-time server')
    dashboardSocket?.emit('join-dashboard', { tenantId })
  })

  dashboardSocket.on('disconnect', () => {
    console.log('[Dashboard] Disconnected from server')
  })

  return dashboardSocket
}

// Disconnect from dashboard
export function disconnectRealtimeDashboard(): void {
  if (dashboardSocket) {
    dashboardSocket.disconnect()
    dashboardSocket = null
  }
}

// Subscribe to sales updates
export function onSalesUpdate(
  callback: (metrics: Partial<RealtimeSalesMetrics>) => void
): () => void {
  if (!dashboardSocket) {
    console.warn('[Dashboard] Socket not initialized')
    return () => {}
  }

  dashboardSocket.on('sales-update', callback)

  return () => {
    dashboardSocket?.off('sales-update', callback)
  }
}

// Subscribe to new order events
export function onNewOrderDashboard(
  callback: (order: RealtimeSalesMetrics['recentOrders'][0]) => void
): () => void {
  if (!dashboardSocket) {
    console.warn('[Dashboard] Socket not initialized')
    return () => {}
  }

  dashboardSocket.on('new-order-dashboard', callback)

  return () => {
    dashboardSocket?.off('new-order-dashboard', callback)
  }
}

// Get current real-time metrics
export async function getRealtimeSalesMetrics(
  tenantId: string
): Promise<RealtimeSalesMetrics> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)

  // Get today's completed orders
  const todayOrders = await prisma.orders.findMany({
    where: {
      tenantId,
      status: OrderStatus.COMPLETED,
      createdAt: { gte: startOfDay },
    },
    include: {
      order_items: {
        include: {
          products: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate metrics
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0)
  const todayOrderCount = todayOrders.length
  const averageOrderValue = todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0

  // Get active orders
  const activeOrders = await prisma.orders.count({
    where: {
      tenantId,
      status: {
        in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY],
      },
    },
  })

  // Get top selling product today
  const productSales = new Map<string, { name: string; quantity: number }>()

  for (const order of todayOrders) {
    for (const item of order.order_items) {
      const existing = productSales.get(item.productId)
      if (existing) {
        existing.quantity += item.quantity
      } else {
        productSales.set(item.productId, {
          name: item.products.name,
          quantity: item.quantity,
        })
      }
    }
  }

  const topSellingProduct = Array.from(productSales.values()).sort(
    (a, b) => b.quantity - a.quantity
  )[0]

  // Sales by hour
  const salesByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    revenue: 0,
    orders: 0,
  }))

  for (const order of todayOrders) {
    const hour = order.createdAt.getHours()
    salesByHour[hour].revenue += order.total
    salesByHour[hour].orders += 1
  }

  // Recent orders
  const recentOrders = todayOrders.slice(0, 10).map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
  }))

  return {
    todaySales: todayOrderCount,
    todayOrders: todayOrderCount,
    todayRevenue,
    activeOrders,
    averageOrderValue,
    topSellingProduct,
    salesByHour,
    recentOrders,
  }
}

// Emit sales update to all dashboard clients
export function emitSalesUpdate(
  tenantId: string,
  metrics: Partial<RealtimeSalesMetrics>
): void {
  if (!dashboardSocket) {
    console.warn('[Dashboard] Socket not initialized')
    return
  }

  dashboardSocket.emit('broadcast-sales-update', {
    tenantId,
    metrics,
  })
}

// Get sales comparison with yesterday
export async function getSalesComparison(tenantId: string) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  const [todayOrders, yesterdayOrders] = await Promise.all([
    prisma.orders.findMany({
      where: {
        tenantId,
        status: OrderStatus.COMPLETED,
        createdAt: { gte: startOfToday },
      },
    }),
    prisma.orders.findMany({
      where: {
        tenantId,
        status: OrderStatus.COMPLETED,
        createdAt: {
          gte: startOfYesterday,
          lt: startOfToday,
        },
      },
    }),
  ])

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)
  const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0)

  const revenueChange =
    yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : 0

  const orderChange =
    yesterdayOrders.length > 0
      ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100
      : 0

  return {
    today: {
      revenue: todayRevenue,
      orders: todayOrders.length,
    },
    yesterday: {
      revenue: yesterdayRevenue,
      orders: yesterdayOrders.length,
    },
    changes: {
      revenue: revenueChange,
      orders: orderChange,
    },
  }
}

// Get live order feed
export async function getLiveOrderFeed(
  tenantId: string,
  limit: number = 20
) {
  return prisma.orders.findMany({
    where: { tenantId },
    include: {
      order_items: {
        include: {
          products: {
            select: { name: true },
          },
        },
      },
      users: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

// Get current hour performance
export async function getCurrentHourPerformance(tenantId: string) {
  const now = new Date()
  const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0)

  const orders = await prisma.orders.findMany({
    where: {
      tenantId,
      status: OrderStatus.COMPLETED,
      createdAt: { gte: startOfHour },
    },
  })

  const revenue = orders.reduce((sum, o) => sum + o.total, 0)
  const orderCount = orders.length
  const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0

  return {
    hour: now.getHours(),
    revenue,
    orderCount,
    averageOrderValue,
  }
}
