// Advanced reporting with profit margins and trend analysis
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface ProfitMarginReport {
  totalRevenue: number
  totalCost: number
  grossProfit: number
  profitMargin: number // Percentage
  netProfit: number
  orderCount: number
}

export interface ProductPerformance {
  productId: string
  productName: string
  quantitySold: number
  revenue: number
  cost: number
  profit: number
  profitMargin: number
}

export interface SalesTrend {
  date: string
  revenue: number
  orders: number
  averageOrderValue: number
}

export interface CategoryPerformance {
  categoryId: string
  categoryName: string
  revenue: number
  profit: number
  profitMargin: number
  orderCount: number
}

// Get profit margin report for date range
export async function getProfitMarginReport(
  tenantId: string,
  dateRange: DateRange
): Promise<ProfitMarginReport> {
  const orders = await prisma.orders.findMany({
    where: {
      tenantId,
      status: OrderStatus.COMPLETED,
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    },
    include: {
      items: {
        include: {
          product: {
            select: { cost: true },
          },
        },
      },
    },
  })

  let totalRevenue = 0
  let totalCost = 0

  for (const order of orders) {
    totalRevenue += order.total

    for (const item of order.items) {
      const itemCost = (item.product?.cost || 0) * item.quantity
      totalCost += itemCost
    }
  }

  const grossProfit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    profitMargin,
    netProfit: grossProfit, // In real scenario, subtract operating expenses
    orderCount: orders.length,
  }
}

// Get top performing products by profit
export async function getTopProductsByProfit(
  tenantId: string,
  dateRange: DateRange,
  limit: number = 10
): Promise<ProductPerformance[]> {
  const orderItems = await prisma.order_items.findMany({
    where: {
      order: {
        tenantId,
        status: OrderStatus.COMPLETED,
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          cost: true,
        },
      },
    },
  })

  // Aggregate by product
  const productMap = new Map<string, ProductPerformance>()

  for (const item of orderItems) {
    const productId = item.product.id
    const existing = productMap.get(productId)

    const revenue = item.subtotal
    const cost = (item.product.cost || 0) * item.quantity
    const profit = revenue - cost
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0

    if (existing) {
      existing.quantitySold += item.quantity
      existing.revenue += revenue
      existing.cost += cost
      existing.profit += profit
      existing.profitMargin =
        existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0
    } else {
      productMap.set(productId, {
        productId,
        productName: item.product.name,
        quantitySold: item.quantity,
        revenue,
        cost,
        profit,
        profitMargin,
      })
    }
  }

  // Sort by profit and return top N
  return Array.from(productMap.values())
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit)
}

// Get sales trends over time
export async function getSalesTrends(
  tenantId: string,
  dateRange: DateRange,
  interval: 'day' | 'week' | 'month' = 'day'
): Promise<SalesTrend[]> {
  const orders = await prisma.orders.findMany({
    where: {
      tenantId,
      status: OrderStatus.COMPLETED,
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    },
    select: {
      createdAt: true,
      total: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Group by interval
  const trendsMap = new Map<string, { revenue: number; count: number }>()

  for (const order of orders) {
    const dateKey = formatDateKey(order.createdAt, interval)
    const existing = trendsMap.get(dateKey)

    if (existing) {
      existing.revenue += order.total
      existing.count += 1
    } else {
      trendsMap.set(dateKey, {
        revenue: order.total,
        count: 1,
      })
    }
  }

  // Convert to array and calculate averages
  return Array.from(trendsMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.count,
      averageOrderValue: data.revenue / data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Get category performance
export async function getCategoryPerformance(
  tenantId: string,
  dateRange: DateRange
): Promise<CategoryPerformance[]> {
  const orderItems = await prisma.order_items.findMany({
    where: {
      order: {
        tenantId,
        status: OrderStatus.COMPLETED,
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
    },
    include: {
      product: {
        select: {
          categoryId: true,
          cost: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  // Aggregate by category
  const categoryMap = new Map<string, {
    name: string
    revenue: number
    cost: number
    orderCount: number
  }>()

  for (const item of orderItems) {
    if (!item.product.categoryId || !item.product.category) continue

    const categoryId = item.product.categoryId
    const existing = categoryMap.get(categoryId)

    const revenue = item.subtotal
    const cost = (item.product.cost || 0) * item.quantity

    if (existing) {
      existing.revenue += revenue
      existing.cost += cost
      existing.orderCount += 1
    } else {
      categoryMap.set(categoryId, {
        name: item.product.category.name,
        revenue,
        cost,
        orderCount: 1,
      })
    }
  }

  // Convert to array and calculate profit margins
  return Array.from(categoryMap.entries())
    .map(([categoryId, data]) => {
      const profit = data.revenue - data.cost
      const profitMargin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0

      return {
        categoryId,
        categoryName: data.name,
        revenue: data.revenue,
        profit,
        profitMargin,
        orderCount: data.orderCount,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
}

// Get hour-by-hour sales analysis
export async function getHourlyAnalysis(
  tenantId: string,
  date: Date
): Promise<Array<{ hour: number; revenue: number; orderCount: number }>> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const orders = await prisma.orders.findMany({
    where: {
      tenantId,
      status: OrderStatus.COMPLETED,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      createdAt: true,
      total: true,
    },
  })

  // Initialize 24 hours
  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    revenue: 0,
    orderCount: 0,
  }))

  for (const order of orders) {
    const hour = order.createdAt.getHours()
    hourlyData[hour].revenue += order.total
    hourlyData[hour].orderCount += 1
  }

  return hourlyData
}

// Compare periods (e.g., this month vs last month)
export async function comparePeriods(
  tenantId: string,
  currentPeriod: DateRange,
  previousPeriod: DateRange
) {
  const [currentReport, previousReport] = await Promise.all([
    getProfitMarginReport(tenantId, currentPeriod),
    getProfitMarginReport(tenantId, previousPeriod),
  ])

  const revenueChange =
    previousReport.totalRevenue > 0
      ? ((currentReport.totalRevenue - previousReport.totalRevenue) /
          previousReport.totalRevenue) *
        100
      : 0

  const profitChange =
    previousReport.grossProfit > 0
      ? ((currentReport.grossProfit - previousReport.grossProfit) /
          previousReport.grossProfit) *
        100
      : 0

  const orderChange =
    previousReport.orderCount > 0
      ? ((currentReport.orderCount - previousReport.orderCount) /
          previousReport.orderCount) *
        100
      : 0

  return {
    current: currentReport,
    previous: previousReport,
    changes: {
      revenue: revenueChange,
      profit: profitChange,
      orders: orderChange,
    },
  }
}

// Helper function to format date key based on interval
function formatDateKey(date: Date, interval: 'day' | 'week' | 'month'): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  switch (interval) {
    case 'day':
      return `${year}-${month}-${day}`
    case 'week':
      const weekNumber = getWeekNumber(date)
      return `${year}-W${String(weekNumber).padStart(2, '0')}`
    case 'month':
      return `${year}-${month}`
    default:
      return `${year}-${month}-${day}`
  }
}

// Get week number of the year
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
