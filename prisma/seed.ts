import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Create Super Admin
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: "admin@pos.com" },
    update: {},
    create: {
      email: "admin@pos.com",
      password: await bcrypt.hash("admin123", 10),
      name: "Super Admin",
    },
  })
  console.log("Created super admin:", superAdmin.email)

  // Create Subscription for Demo Tenant
  const subscription = await prisma.subscription.create({
    data: {
      plan: "PRO",
      status: "ACTIVE",
      amount: 79,
      currency: "USD",
      interval: "month",
      maxUsers: 10,
      maxLocations: 1,
    },
  })
  console.log("Created subscription:", subscription.id)

  // Create Demo Tenant (Coffee Shop)
  const tenant = await prisma.tenant.create({
    data: {
      name: "Demo Coffee Shop",
      subdomain: "demo",
      email: "demo@coffee.com",
      phone: "+1 234 567 8900",
      address: "123 Main Street, City, State 12345",
      status: "ACTIVE",
      businessType: "COFFEE_SHOP",
      subscriptionId: subscription.id,
      settings: {
        create: {
          currency: "USD",
          currencySymbol: "$",
          timezone: "America/New_York",
          taxRate: 8.5,
          taxName: "Sales Tax",
          receiptFooter: "Thank you for your visit!",
          enableInventory: true,
          enableTables: true,
          enableKitchenDisplay: false,
        },
      },
    },
  })
  console.log("Created tenant:", tenant.name)

  // Create Admin User for Demo Tenant
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@demo.com",
      password: await bcrypt.hash("password", 10),
      name: "Admin User",
      role: "BUSINESS_ADMIN",
      tenantId: tenant.id,
      isActive: true,
    },
  })
  console.log("Created admin user:", adminUser.email)

  // Create Cashier User
  const cashierUser = await prisma.user.create({
    data: {
      email: "cashier@demo.com",
      password: await bcrypt.hash("password", 10),
      name: "Cashier User",
      role: "CASHIER",
      tenantId: tenant.id,
      isActive: true,
    },
  })
  console.log("Created cashier user:", cashierUser.email)

  // Create Categories
  const beverages = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: "Beverages",
      sortOrder: 1,
    },
  })

  const food = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: "Food",
      sortOrder: 2,
    },
  })

  const desserts = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: "Desserts",
      sortOrder: 3,
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
    await prisma.product.create({
      data: {
        ...product,
        tenantId: tenant.id,
        createdById: adminUser.id,
        isActive: true,
        isFavorite: Math.random() > 0.7,
      },
    })
  }
  console.log("Created products")

  // Create Tables (for restaurant mode)
  const tableNames = ["Table 1", "Table 2", "Table 3", "Table 4", "Table 5", "Table 6"]
  for (const tableName of tableNames) {
    await prisma.table.create({
      data: {
        tenantId: tenant.id,
        name: tableName,
        capacity: 4,
        status: "AVAILABLE",
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
    await prisma.customer.create({
      data: {
        ...customer,
        tenantId: tenant.id,
      },
    })
  }
  console.log("Created customers")

  // Create Sample Discount
  await prisma.discount.create({
    data: {
      tenantId: tenant.id,
      name: "Summer Special",
      code: "SUMMER10",
      type: "PERCENTAGE",
      value: 10,
      minimumPurchase: 20,
      isActive: true,
    },
  })
  console.log("Created discount")

  console.log("Seed completed!")
  console.log("\nLogin Credentials:")
  console.log("================================")
  console.log("Super Admin:")
  console.log("  Email: admin@pos.com")
  console.log("  Password: admin123")
  console.log("\nDemo Tenant (subdomain: demo)")
  console.log("  Admin:")
  console.log("    Email: admin@demo.com")
  console.log("    Password: password")
  console.log("  Cashier:")
  console.log("    Email: cashier@demo.com")
  console.log("    Password: password")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

