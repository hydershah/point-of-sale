import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCurrentTenant } from "@/lib/tenant"

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const tenant = await getCurrentTenant()

    if (!session || !tenant || session.user.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const product = await prisma.products.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
      include: {
        categories: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, description, price, cost, categoryId, sku, barcode, trackStock, stock, lowStockAlert, image, isActive } = body

    const parsedCost =
      typeof cost === "number"
        ? cost
        : cost === undefined || cost === null || cost === ""
        ? null
        : parseFloat(cost)

    // Verify product belongs to this tenant
    const existingProduct = await prisma.products.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const product = await prisma.products.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price: typeof price === "number" ? price : parseFloat(price),
        cost: parsedCost,
        categoryId: categoryId || null,
        sku,
        barcode,
        trackStock: trackStock || false,
        stock: trackStock ? (typeof stock === "number" ? stock : parseInt(stock) || 0) : 0,
        lowStockAlert:
          lowStockAlert === undefined || lowStockAlert === null || lowStockAlert === ""
            ? null
            : typeof lowStockAlert === "number"
            ? lowStockAlert
            : parseInt(lowStockAlert),
        image,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const tenant = await getCurrentTenant()

    if (!session || !tenant || session.user.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions
    if (session.user.role !== "BUSINESS_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify product belongs to this tenant
    const existingProduct = await prisma.products.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    await prisma.products.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}
