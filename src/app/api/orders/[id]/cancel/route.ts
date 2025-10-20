import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCurrentTenant } from "@/lib/tenant"
import { nanoid } from "nanoid"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const tenant = await getCurrentTenant()

    if (!session || !tenant || session.user.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reason } = await req.json().catch(() => ({ reason: "" }))

    // Load order with items and payments
    const order = await prisma.orders.findFirst({
      where: { id: params.id, tenantId: tenant.id },
      include: {
        order_items: true,
        payments: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Order already cancelled" }, { status: 400 })
    }

    // Process cancellation in a transaction
    await prisma.$transaction(async (tx) => {
      // Restore stock for all items
      for (const item of order.order_items) {
        await tx.products.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
          },
        })
      }

      // Record refund transaction (simple ledger entry)
      await tx.transactions.create({
        data: {
          id: nanoid(),
          tenantId: tenant.id,
          type: "REFUND",
          amount: order.total,
          description: `Refund for Order #${order.orderNumber}`,
          referenceId: order.id,
          referenceType: "ORDER",
        },
      })

      // Mark order as cancelled
      await tx.orders.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy: session.user.id,
          cancellationReason: reason || null,
          updatedAt: new Date(),
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error cancelling order:", error)
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 })
  }
}

