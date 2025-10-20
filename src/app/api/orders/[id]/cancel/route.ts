import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCurrentTenant } from "@/lib/tenant"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const tenant = await getCurrentTenant()

    if (!session || !tenant || session.user.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reason } = await req.json()
    const resolvedParams = params instanceof Promise ? await params : params
    const orderId = resolvedParams.id

    // Get the order with its items
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if order can be cancelled (only COMPLETED orders)
    if (order.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only completed orders can be cancelled" },
        { status: 400 }
      )
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Order is already cancelled" },
        { status: 400 }
      )
    }

    // Cancel the order in a transaction
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy: session.user.id,
          cancellationReason: reason || null,
        },
        include: {
          items: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      })

      // Restore stock for tracked products
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })

        if (product && product.trackStock) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          })
        }
      }

      // Create a refund transaction record
      await tx.transaction.create({
        data: {
          tenantId: tenant.id,
          type: "REFUND",
          amount: order.total,
          description: `Order #${order.orderNumber} cancelled${reason ? `: ${reason}` : ""}`,
          referenceId: order.id,
          referenceType: "ORDER_CANCELLATION",
        },
      })

      // Create audit log
      await tx.audit_logs.create({
        data: {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tenantId: tenant.id,
          userId: session.user.id,
          userEmail: session.user.email || "",
          userName: session.user.name || "",
          action: "REFUND",
          entity: "ORDER",
          entityId: order.id,
          description: `Cancelled order #${order.orderNumber}${reason ? `: ${reason}` : ""}`,
          metadata: {
            orderNumber: order.orderNumber,
            ticketId: order.ticketId,
            total: order.total,
            reason: reason || null,
          },
        },
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      order: cancelledOrder,
    })
  } catch (error) {
    console.error("Error cancelling order:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to cancel order"
    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 500 }
    )
  }
}
