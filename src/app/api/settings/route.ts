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

    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: { settings: true },
    })

    if (!tenantData) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    const settings = {
      businessName: tenantData.name,
      email: tenantData.email,
      phone: tenantData.phone || "",
      address: tenantData.address || "",
      currency: tenantData.settings?.currency || "USD",
      currencySymbol: tenantData.settings?.currencySymbol || "$",
      taxRate: tenantData.settings?.taxRate || 0,
      taxName: tenantData.settings?.taxName || "Tax",
      receiptHeader: tenantData.settings?.receiptHeader || "",
      receiptFooter: tenantData.settings?.receiptFooter || "",
      printerIp: tenantData.settings?.printerIp || "",
      printerPort: tenantData.settings?.printerPort || 9100,
      enableKitchenDisplay: tenantData.settings?.enableKitchenDisplay || false,
      enableTables: tenantData.settings?.enableTables || false,
      enableInventory: tenantData.settings?.enableInventory || true,
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const tenant = await getCurrentTenant()

    if (!session || !tenant || session.user.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== "BUSINESS_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const {
      businessName,
      email,
      phone,
      address,
      currency,
      currencySymbol,
      taxRate,
      taxName,
      receiptHeader,
      receiptFooter,
      printerIp,
      printerPort,
    } = body

    // Update tenant
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        name: businessName,
        email,
        phone,
        address,
      },
    })

    // Update settings
    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {
        currency,
        currencySymbol,
        taxRate: parseFloat(taxRate),
        taxName,
        receiptHeader,
        receiptFooter,
        printerIp,
        printerPort: parseInt(printerPort),
      },
      create: {
        tenantId: tenant.id,
        currency,
        currencySymbol,
        taxRate: parseFloat(taxRate),
        taxName,
        receiptHeader,
        receiptFooter,
        printerIp,
        printerPort: parseInt(printerPort),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}

