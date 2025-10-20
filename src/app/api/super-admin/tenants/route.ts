import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      subdomain,
      email,
      phone,
      address,
      businessType,
      logo,
      primaryColor,
      adminName,
      adminEmail,
      adminPassword,
    } = body

    // Check if subdomain is already taken
    const existingTenant = await prisma.tenants.findUnique({
      where: { subdomain },
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: "Subdomain already taken" },
        { status: 400 }
      )
    }

    // Create subscription (trial by default)
    const now = new Date()

    const subscription = await prisma.subscriptions.create({
      data: {
        id: randomUUID(),
        plan: "BASIC",
        status: "TRIALING",
        amount: 29,
        currency: "USD",
        interval: "month",
        maxUsers: 5,
        maxLocations: 1,
        trialEnds: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        updatedAt: now,
      },
    })

    // Create tenant
    const tenant = await prisma.tenants.create({
      data: {
        id: randomUUID(),
        name,
        subdomain,
        email,
        phone,
        address,
        businessType,
        logo: logo || null,
        primaryColor: primaryColor || null,
        status: "TRIAL",
        updatedAt: now,
        subscriptions: {
          connect: {
            id: subscription.id,
          },
        },
        tenant_settings: {
          create: {
            id: randomUUID(),
            currency: "USD",
            currencySymbol: "$",
            timezone: "UTC",
            taxRate: 0,
            taxName: "Tax",
            receiptFooter: null,
            receiptHeader: null,
            enableInventory: true,
            enableTables: businessType === "RESTAURANT",
            enableKitchenDisplay: businessType === "RESTAURANT",
            enableTakeaway: businessType === "TAKEAWAY" || businessType === "MIXED",
            enableLoyalty: false,
            updatedAt: now,
          },
        },
      },
    })

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    await prisma.users.create({
      data: {
        id: randomUUID(),
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: "BUSINESS_ADMIN",
        tenantId: tenant.id,
        isActive: true,
        updatedAt: now,
      },
    })

    // TODO: Send welcome email with login credentials

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
      },
    })
  } catch (error) {
    console.error("Error creating tenant:", error)
    return NextResponse.json(
      { error: "Failed to create tenant" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenants = await prisma.tenants.findMany({
      include: {
        subscription: true,
        _count: {
          select: {
            users: true,
            orders: true,
            products: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tenants })
  } catch (error) {
    console.error("Error fetching tenants:", error)
    return NextResponse.json(
      { error: "Failed to fetch tenants" },
      { status: 500 }
    )
  }
}
