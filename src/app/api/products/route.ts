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

    const url = new URL(req.url)
    const all = url.searchParams.get("all") === "true"

    const where: any = { tenantId: tenant.id }
    if (!all) {
      where.isActive = true
    }

    const products = await prisma.products.findMany({
      where,
      include: {
        categories: {
          select: { name: true },
        },
      },
      orderBy: { name: "asc" },
    })

    const formattedProducts = all
      ? products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          price: p.price,
          cost: p.cost ?? null,
          category: p.categories?.name || "Uncategorized",
          categoryId: p.categoryId || null,
          sku: p.sku || "",
          barcode: p.barcode || "",
          stock: p.stock,
          trackStock: p.trackStock,
          lowStockAlert: p.lowStockAlert ?? null,
          isActive: p.isActive,
          image: p.image || undefined,
        }))
      : products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.categories?.name || "Uncategorized",
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
    const { name, description, price, cost, categoryId, sku, barcode, trackStock, stock, image, lowStockAlert } = body

    const parsedCost =
      typeof cost === "number"
        ? cost
        : cost === undefined || cost === null || cost === ""
        ? null
        : parseFloat(cost)

    // Import nanoid at the top of the file
    const { nanoid } = await import('nanoid')

    const product = await prisma.products.create({
      data: {
        id: nanoid(),
        tenantId: tenant.id,
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
        createdById: session.user.id,
        updatedAt: new Date(),
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
