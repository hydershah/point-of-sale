import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCurrentTenant } from "@/lib/tenant"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const tenant = await getCurrentTenant()

    if (!session || !tenant || session.user.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tables = await prisma.tables.findMany({
      where: { tenantId: tenant.id },
      include: {
        orders: {
          where: {
            status: { in: ["PENDING", "PREPARING"] },
          },
          include: {
            order_items: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    const formattedTables = tables.map((table) => {
      const activeOrder = table.orders[0]
      return {
        id: table.id,
        name: table.name,
        capacity: table.capacity,
        status: table.status,
        currentOrder: activeOrder
          ? {
              id: activeOrder.id,
              orderNumber: activeOrder.orderNumber,
              total: activeOrder.total,
              items: activeOrder.order_items.length,
            }
          : undefined,
      }
    })

    return NextResponse.json({ tables: formattedTables })
  } catch (error) {
    console.error("Error fetching tables:", error)
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const tenant = await getCurrentTenant()

    if (!session || !tenant || session.user.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions
    if (session.user.role === "CASHIER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { name, capacity } = body

    const { nanoid } = await import('nanoid')

    const table = await prisma.tables.create({
      data: {
        id: nanoid(),
        tenantId: tenant.id,
        name,
        capacity: parseInt(capacity),
        status: "AVAILABLE",
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ table })
  } catch (error) {
    console.error("Error creating table:", error)
    return NextResponse.json(
      { error: "Failed to create table" },
      { status: 500 }
    )
  }
}

