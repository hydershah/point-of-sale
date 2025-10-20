import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"

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
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain },
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: "Subdomain already taken" },
        { status: 400 }
      )
    }

    // Create subscription (trial by default)
    const subscription = await prisma.subscription.create({
      data: {
        plan: "BASIC",
        status: "TRIALING",
        amount: 29,
        currency: "USD",
        interval: "month",
        maxUsers: 5,
        maxLocations: 1,
        trialEnds: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      },
    })

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        subdomain,
        email,
        phone,
        address,
        businessType,
        logo: logo || null,
        primaryColor: primaryColor || null,
        status: "TRIAL",
        subscriptionId: subscription.id,
        settings: {
          create: {
            currency: "USD",
            currencySymbol: "$",
            timezone: "UTC",
            taxRate: 0,
            taxName: "Tax",
            enableInventory: true,
            enableTables: businessType === "RESTAURANT",
            enableKitchenDisplay: businessType === "RESTAURANT",
            enableTakeaway: businessType === "TAKEAWAY" || businessType === "MIXED",
          },
        },
      },
    })

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: "BUSINESS_ADMIN",
        tenantId: tenant.id,
        isActive: true,
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

    const tenants = await prisma.tenant.findMany({
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

