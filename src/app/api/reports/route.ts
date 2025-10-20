import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCurrentTenant } from "@/lib/tenant"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const tenant = await getCurrentTenant()

    if (!session || !tenant || session.user.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "week"

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get summary data
    const orders = await prisma.order.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: startDate },
        status: "COMPLETED",
      },
      include: {
        items: true,
        payments: true,
      },
    })

    const totalSales = orders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    // Get top product
    const productSales = await prisma.orderItem.groupBy({
      by: ["name"],
      where: {
        order: {
          tenantId: tenant.id,
          createdAt: { gte: startDate },
          status: "COMPLETED",
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
    })

    const topProduct = productSales[0]?.name || "N/A"

    // Get daily sales
    const dailySales = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split("T")[0]
      if (!acc[date]) {
        acc[date] = { date, sales: 0, orders: 0 }
      }
      acc[date].sales += order.total
      acc[date].orders += 1
      return acc
    }, {} as Record<string, { date: string; sales: number; orders: number }>)

    // Get payment methods breakdown
    const paymentMethods = orders.reduce((acc, order) => {
      order.payments.forEach((payment) => {
        if (!acc[payment.method]) {
          acc[payment.method] = { method: payment.method, count: 0, total: 0 }
        }
        acc[payment.method].count += 1
        acc[payment.method].total += payment.amount
      })
      return acc
    }, {} as Record<string, { method: string; count: number; total: number }>)

    const report = {
      summary: {
        totalSales,
        totalOrders,
        averageOrderValue,
        topProduct,
      },
      dailySales: Object.values(dailySales).sort((a, b) => 
        a.date.localeCompare(b.date)
      ),
      productSales: productSales.map((p) => ({
        name: p.name,
        quantity: p._sum.quantity || 0,
        revenue: p._sum.subtotal || 0,
      })),
      paymentMethods: Object.values(paymentMethods),
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}

