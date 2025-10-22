import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCurrentTenant } from "@/lib/tenant"
import { nanoid } from "nanoid"

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const tenant = await getCurrentTenant()

    if (!session || !tenant || session.user.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { items, paymentMethod, type, customerId, tableId, notes } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 })
    }

    // Get tenant settings for tax calculation
    const settings = await prisma.tenant_settings.findUnique({
      where: { tenantId: tenant.id },
    })

    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },
    })

    const productMap = new Map(products.map((product) => [product.id, product]))

    // Calculate order totals
    let subtotal = 0
    const orderItems: Array<{
      id: string
      productId: string
      name: string
      price: number
      quantity: number
      subtotal: number
      modifiers: any
      notes: string | null
    }> = []
    const stockAdjustments = new Map<string, number>()

    for (const item of items) {
      const product = productMap.get(item.productId)

      if (!product || product.tenantId !== tenant.id) {
        return NextResponse.json(
          { error: `Invalid product: ${item.productId}` },
          { status: 400 }
        )
      }

      const quantity = Number(item.quantity) || 0
      const price = Number(product.price)

      stockAdjustments.set(
        product.id,
        (stockAdjustments.get(product.id) || 0) + quantity
      )

      const itemSubtotal = price * quantity
      subtotal += itemSubtotal

      orderItems.push({
        id: nanoid(),
        productId: product.id,
        name: product.name,
        price,
        quantity,
        subtotal: itemSubtotal,
        modifiers: item.modifiers || null,
        notes: item.notes || null,
      })
    }

    for (const [productId, quantity] of stockAdjustments) {
      const product = productMap.get(productId)

      if (product?.trackStock && product.stock < quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        )
      }
    }

    // Calculate tax
    const taxRate = settings?.taxRate || 0
    const tax = subtotal * (taxRate / 100)
    const total = subtotal + tax

    // Get next order number for this tenant
    const lastOrder = await prisma.orders.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { orderNumber: "desc" },
    })
    const orderNumber = (lastOrder?.orderNumber || 0) + 1

    // Generate unique ticket ID
    const ticketId = `TKT-${nanoid(10)}`

    // Create order in transaction
    const order = await prisma.$transaction(
      async (tx) => {
        const completedAt = new Date()
        const createdOrder = await tx.orders.create({
          data: {
            id: nanoid(),
            tenantId: tenant.id,
            orderNumber,
            ticketId,
            type: type || "DINE_IN",
            status: "COMPLETED",
            completedAt,
            userId: session.user.id,
            customerId,
            tableId,
            notes,
            subtotal,
            tax,
            total,
            updatedAt: completedAt,
            order_items: {
              create: orderItems,
            },
            payments: {
              create: {
                id: nanoid(),
                method: paymentMethod,
                amount: total,
              },
            },
          },
        })

        for (const [productId, quantity] of stockAdjustments) {
          const product = productMap.get(productId)

          if (product?.trackStock) {
            await tx.products.update({
              where: { id: productId },
              data: {
                stock: {
                  decrement: quantity,
                },
              },
            })
          }
        }

        await tx.transactions.create({
          data: {
            id: nanoid(),
            tenantId: tenant.id,
            type: "SALE",
            amount: total,
            description: `Order #${orderNumber}`,
            referenceId: createdOrder.id,
            referenceType: "ORDER",
          },
        })

        return createdOrder
      },
      { timeout: 15000 }
    )

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        ticketId: order.ticketId,
        total: order.total,
      },
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const tenant = await getCurrentTenant()

    if (!session || !tenant || session.user.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: any = { tenantId: tenant.id }
    if (status) {
      where.status = status
    }

    const orderRecords = await prisma.orders.findMany({
      where,
      include: {
        order_items: true,
        payments: true,
        customers: {
          select: {
            name: true,
          },
        },
        users: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    const orders = orderRecords.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      ticketId: order.ticketId,
      type: order.type,
      status: order.status,
      total: order.total,
      subtotal: order.subtotal,
      tax: order.tax,
      createdAt: order.createdAt,
      customerName: order.customerName || order.customers?.name || undefined,
      user: {
        name: order.users?.name || "Unknown",
      },
      items: order.order_items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      payments: order.payments,
    }))

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}
