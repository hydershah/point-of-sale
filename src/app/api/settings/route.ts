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

    const tenantData = await prisma.tenants.findUnique({
      where: { id: tenant.id },
      include: { tenant_settings: true },
    })

    if (!tenantData) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    const settings = {
      businessName: tenantData.name,
      email: tenantData.email,
      phone: tenantData.phone || "",
      address: tenantData.address || "",
      currency: tenantData.tenant_settings?.currency || "USD",
      currencySymbol: tenantData.tenant_settings?.currencySymbol || "$",
      taxRate: tenantData.tenant_settings?.taxRate || 0,
      taxName: tenantData.tenant_settings?.taxName || "Tax",
      receiptHeader: tenantData.tenant_settings?.receiptHeader || "",
      receiptFooter: tenantData.tenant_settings?.receiptFooter || "",
      printerIp: tenantData.tenant_settings?.printerIp || "",
      printerPort: tenantData.tenant_settings?.printerPort || 9100,
      enableKitchenDisplay: tenantData.tenant_settings?.enableKitchenDisplay || false,
      enableTables: tenantData.tenant_settings?.enableTables || false,
      enableInventory: tenantData.tenant_settings?.enableInventory ?? true,
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

    const parsedTaxRate =
      typeof taxRate === "number" ? taxRate : parseFloat(taxRate ?? "0")
    const parsedPrinterPort =
      typeof printerPort === "number"
        ? printerPort
        : parseInt(printerPort ?? "9100", 10)

    // Update tenant
    await prisma.tenants.update({
      where: { id: tenant.id },
      data: {
        name: businessName,
        email,
        phone,
        address,
      },
    })

    // Update settings
    await prisma.tenant_settings.upsert({
      where: { tenantId: tenant.id },
      update: {
        currency,
        currencySymbol,
        taxRate: parsedTaxRate,
        taxName,
        receiptHeader,
        receiptFooter,
        printerIp,
        printerPort: parsedPrinterPort,
      },
      create: {
        tenantId: tenant.id,
        currency,
        currencySymbol,
        taxRate: parsedTaxRate,
        taxName,
        receiptHeader,
        receiptFooter,
        printerIp,
        printerPort: parsedPrinterPort,
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
