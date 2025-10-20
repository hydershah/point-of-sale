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

    const products = await prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category?.name || "Uncategorized",
      image: p.image,
      stock: p.stock,
      trackStock: p.trackStock,
      barcode: p.barcode,
    }))

    return NextResponse.json({ products: formattedProducts })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
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
    const { name, description, price, cost, categoryId, sku, barcode, trackStock, stock, image } = body

    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name,
        description,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : null,
        categoryId,
        sku,
        barcode,
        trackStock: trackStock || false,
        stock: trackStock ? parseInt(stock) || 0 : 0,
        image,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}

