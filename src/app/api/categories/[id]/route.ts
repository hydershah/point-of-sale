import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCurrentTenant } from "@/lib/tenant"

export const dynamic = 'force-dynamic'

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

    if (session.user.role === "CASHIER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, color, icon } = body

    const updated = await prisma.categories.update({
      where: { id: params.id },
      data: {
        name,
        description,
        color,
        icon,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ category: updated })
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json(
      { error: "Failed to update category" },
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

    if (session.user.role === "CASHIER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Ensure category belongs to tenant
    const category = await prisma.categories.findUnique({ where: { id: params.id } })
    if (!category || category.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Optional: prevent delete if products exist
    const count = await prisma.products.count({ where: { categoryId: params.id } })
    if (count > 0) {
      return NextResponse.json(
        { error: "Cannot delete a category with products. Reassign or remove products first." },
        { status: 400 }
      )
    }

    await prisma.categories.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    )
  }
}

