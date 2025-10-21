import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { nanoid } from "nanoid"
import { seedFeatures } from "./seeds/features"
import { seedBusinessTypes } from "./seeds/business-types"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Seed feature catalog and business type templates
  console.log("\n📋 Seeding feature system...")
  await seedFeatures()
  await seedBusinessTypes()
  console.log("✅ Feature system seeded\n")

  // Environment variables for secure credentials
  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "admin@pos.com"
  const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD
  const DEMO_MODE = process.env.SEED_DEMO_DATA === "true"

  if (!SUPER_ADMIN_PASSWORD) {
    console.error("ERROR: SUPER_ADMIN_PASSWORD environment variable is required")
    console.error("Example: SUPER_ADMIN_PASSWORD='your-secure-password' npm run seed")
    process.exit(1)
  }

  // Validate password strength
  if (SUPER_ADMIN_PASSWORD.length < 12) {
    console.error("ERROR: SUPER_ADMIN_PASSWORD must be at least 12 characters long")
    process.exit(1)
  }

  // Create Super Admin
  const superAdmin = await prisma.super_admins.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: {},
    create: {
      id: nanoid(),
      email: SUPER_ADMIN_EMAIL,
      password: await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12),
      name: "Super Admin",
      updatedAt: new Date(),
    },
  })
  console.log("Created super admin:", superAdmin.email)

  // Only create demo data if explicitly requested
  if (!DEMO_MODE) {
    console.log("\nSeed completed! (Production mode - no demo data created)")
    console.log("To create demo data, run: SEED_DEMO_DATA=true npm run seed")
    return
  }

  console.log("\n⚠️  Creating demo data (DEMO MODE ENABLED)...")

  // Create Subscription for Demo Tenant
  const subscription = await prisma.subscriptions.create({
    data: {
      id: nanoid(),
      plan: "PRO",
      status: "ACTIVE",
      amount: 79,
      currency: "USD",
      interval: "month",
      maxUsers: 10,
      maxLocations: 1,
      updatedAt: new Date(),
    },
  })
  console.log("Created subscription:", subscription.id)

  // Find Coffee Shop template
  const coffeeShopTemplate = await prisma.business_type_templates.findUnique({
    where: { typeKey: "coffee_shop_takeaway" },
  })

  // Create Demo Tenant (Coffee Shop)
  const tenant = await prisma.tenants.create({
    data: {
      id: nanoid(),
      name: "Demo Coffee Shop",
      subdomain: "demo",
      email: "demo@coffee.com",
      phone: "+1 234 567 8900",
      address: "123 Main Street, City, State 12345",
      status: "ACTIVE",
      businessType: "COFFEE_SHOP",
      ...(coffeeShopTemplate?.id ? { businessTemplateId: coffeeShopTemplate.id } : {}),
      updatedAt: new Date(),
      subscriptions: {
        connect: {
          id: subscription.id
        }
      },
      tenant_settings: {
        create: {
          id: nanoid(),
          currency: "USD",
          currencySymbol: "$",
          timezone: "America/New_York",
          taxRate: 8.5,
          taxName: "Sales Tax",
          receiptFooter: "Thank you for your visit!",
          enableInventory: true,
          enableTables: true,
          enableKitchenDisplay: false,
          updatedAt: new Date(),
        },
      },
    },
  })
  console.log("Created tenant:", tenant.name)

  // Enable features for demo tenant based on template
  if (coffeeShopTemplate) {
    const templateFeatures = await prisma.template_features.findMany({
      where: { templateId: coffeeShopTemplate.id },
      include: { feature: true },
    })

    for (const tf of templateFeatures) {
      await prisma.tenant_features.create({
        data: {
          id: nanoid(),
          tenantId: tenant.id,
          featureId: tf.featureId,
          isEnabled: tf.isEnabledByDefault,
          enabledAt: tf.isEnabledByDefault ? new Date() : null,
          updatedAt: new Date(),
        },
      })
    }
    console.log(`Enabled ${templateFeatures.length} features for demo tenant`)
  }

  // Create Admin User for Demo Tenant
  const adminUser = await prisma.users.create({
    data: {
      id: nanoid(),
      email: "admin@demo.com",
      password: await bcrypt.hash("password", 10),
      name: "Admin User",
      role: "BUSINESS_ADMIN",
      tenantId: tenant.id,
      isActive: true,
      updatedAt: new Date(),
    },
  })
  console.log("Created admin user:", adminUser.email)

  // Create Cashier User
  const cashierUser = await prisma.users.create({
    data: {
      id: nanoid(),
      email: "cashier@demo.com",
      password: await bcrypt.hash("password", 10),
      name: "Cashier User",
      role: "CASHIER",
      tenantId: tenant.id,
      isActive: true,
      updatedAt: new Date(),
    },
  })
  console.log("Created cashier user:", cashierUser.email)

  // Create Categories
  const beverages = await prisma.categories.create({
    data: {
      id: nanoid(),
      tenantId: tenant.id,
      name: "Beverages",
      sortOrder: 1,
      updatedAt: new Date(),
    },
  })

  const food = await prisma.categories.create({
    data: {
      id: nanoid(),
      tenantId: tenant.id,
      name: "Food",
      sortOrder: 2,
      updatedAt: new Date(),
    },
  })

  const desserts = await prisma.categories.create({
    data: {
      id: nanoid(),
      tenantId: tenant.id,
      name: "Desserts",
      sortOrder: 3,
      updatedAt: new Date(),
    },
  })

  console.log("Created categories")

  // Create Products
  const products = [
    {
      name: "Espresso",
      description: "Rich and bold espresso shot",
      price: 2.99,
      cost: 0.50,
      categoryId: beverages.id,
      sku: "BEV-001",
      trackStock: true,
      stock: 100,
    },
    {
      name: "Cappuccino",
      description: "Espresso with steamed milk foam",
      price: 4.99,
      cost: 0.80,
      categoryId: beverages.id,
      sku: "BEV-002",
      trackStock: true,
      stock: 100,
    },
    {
      name: "Latte",
      description: "Smooth espresso with steamed milk",
      price: 4.99,
      cost: 0.80,
      categoryId: beverages.id,
      sku: "BEV-003",
      trackStock: true,
      stock: 100,
    },
    {
      name: "Americano",
      description: "Espresso with hot water",
      price: 3.49,
      cost: 0.60,
      categoryId: beverages.id,
      sku: "BEV-004",
      trackStock: true,
      stock: 100,
    },
    {
      name: "Croissant",
      description: "Buttery French pastry",
      price: 3.99,
      cost: 1.20,
      categoryId: food.id,
      sku: "FOOD-001",
      trackStock: true,
      stock: 50,
    },
    {
      name: "Blueberry Muffin",
      description: "Fresh baked muffin with blueberries",
      price: 3.49,
      cost: 1.00,
      categoryId: food.id,
      sku: "FOOD-002",
      trackStock: true,
      stock: 40,
    },
    {
      name: "Chocolate Chip Cookie",
      description: "Warm chocolate chip cookie",
      price: 2.49,
      cost: 0.70,
      categoryId: desserts.id,
      sku: "DES-001",
      trackStock: true,
      stock: 60,
      lowStockAlert: 10,
    },
    {
      name: "Cheesecake Slice",
      description: "Creamy New York style cheesecake",
      price: 5.99,
      cost: 2.00,
      categoryId: desserts.id,
      sku: "DES-002",
      trackStock: true,
      stock: 20,
    },
  ]

  for (const product of products) {
    await prisma.products.create({
      data: {
        ...product,
        id: nanoid(),
        tenantId: tenant.id,
        createdById: adminUser.id,
        isActive: true,
        isFavorite: Math.random() > 0.7,
        updatedAt: new Date(),
      },
    })
  }
  console.log("Created products")

  // Create Tables (for restaurant mode)
  const tableNames = ["Table 1", "Table 2", "Table 3", "Table 4", "Table 5", "Table 6"]
  for (const tableName of tableNames) {
    await prisma.tables.create({
      data: {
        id: nanoid(),
        tenantId: tenant.id,
        name: tableName,
        capacity: 4,
        status: "AVAILABLE",
        updatedAt: new Date(),
      },
    })
  }
  console.log("Created tables")

  // Create Sample Customers
  const customers = [
    {
      name: "John Doe",
      email: "john@example.com",
      phone: "+1 234 567 1111",
      address: "456 Oak St, City, State",
      loyaltyPoints: 50,
      totalSpent: 125.50,
      visitCount: 8,
    },
    {
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+1 234 567 2222",
      address: "789 Pine St, City, State",
      loyaltyPoints: 30,
      totalSpent: 78.25,
      visitCount: 5,
    },
    {
      name: "Bob Wilson",
      email: "bob@example.com",
      phone: "+1 234 567 3333",
      loyaltyPoints: 100,
      totalSpent: 256.75,
      visitCount: 15,
    },
  ]

  for (const customer of customers) {
    await prisma.customers.create({
      data: {
        ...customer,
        id: nanoid(),
        tenantId: tenant.id,
        updatedAt: new Date(),
      },
    })
  }
  console.log("Created customers")

  // Create Sample Discount
  await prisma.discounts.create({
    data: {
      id: nanoid(),
      tenantId: tenant.id,
      name: "Summer Special",
      code: "SUMMER10",
      type: "PERCENTAGE",
      value: 10,
      minimumPurchase: 20,
      isActive: true,
      updatedAt: new Date(),
    },
  })
  console.log("Created discount")

  console.log("\n✅ Seed completed!")
  console.log("\n⚠️  DEMO MODE LOGIN CREDENTIALS (FOR DEVELOPMENT ONLY):")
  console.log("================================")
  console.log("Super Admin:")
  console.log("  Email:", SUPER_ADMIN_EMAIL)
  console.log("  Password: [SET VIA SUPER_ADMIN_PASSWORD]")
  console.log("\nDemo Tenant (subdomain: demo)")
  console.log("  Admin:")
  console.log("    Email: admin@demo.com")
  console.log("    Password: password")
  console.log("  Cashier:")
  console.log("    Email: cashier@demo.com")
  console.log("    Password: password")
  console.log("\n⚠️  WARNING: Change all passwords before deploying to production!")
  console.log("⚠️  Run without SEED_DEMO_DATA=true for production deployments")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

