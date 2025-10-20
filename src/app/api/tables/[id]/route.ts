import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCurrentTenant } from "@/lib/tenant"

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

    const body = await req.json()
    const { name, capacity, status } = body

    // Verify table belongs to this tenant
    const existingTable = await prisma.tables.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
    })

    if (!existingTable) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    const table = await prisma.tables.update({
      where: { id: params.id },
      data: {
        name,
        capacity: capacity ? parseInt(capacity) : undefined,
        status,
      },
    })

    return NextResponse.json({ table })
  } catch (error) {
    console.error("Error updating table:", error)
    return NextResponse.json(
      { error: "Failed to update table" },
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

    // Verify table belongs to this tenant
    const existingTable = await prisma.tables.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
    })

    if (!existingTable) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    await prisma.tables.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting table:", error)
    return NextResponse.json(
      { error: "Failed to delete table" },
      { status: 500 }
    )
  }
}
