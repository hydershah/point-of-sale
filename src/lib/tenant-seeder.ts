import { prisma } from './prisma'
import { BusinessType } from '@prisma/client'
import { nanoid } from 'nanoid'

interface SampleProduct {
  name: string
  description: string
  price: number
  cost?: number
  categoryName: string
  trackStock: boolean
  stock?: number
  sku?: string
}

const RESTAURANT_PRODUCTS: SampleProduct[] = [
  {
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and basil',
    price: 12.99,
    cost: 4.50,
    categoryName: 'Main Course',
    trackStock: false,
  },
  {
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with parmesan and croutons',
    price: 8.99,
    cost: 3.00,
    categoryName: 'Appetizers',
    trackStock: false,
  },
  {
    name: 'Grilled Salmon',
    description: 'Fresh salmon with vegetables and lemon butter',
    price: 18.99,
    cost: 8.00,
    categoryName: 'Main Course',
    trackStock: false,
  },
  {
    name: 'Tiramisu',
    description: 'Classic Italian dessert',
    price: 6.99,
    cost: 2.50,
    categoryName: 'Desserts',
    trackStock: false,
  },
  {
    name: 'House Red Wine',
    description: 'Glass of premium red wine',
    price: 7.99,
    cost: 3.00,
    categoryName: 'Beverages',
    trackStock: true,
    stock: 50,
  },
]

const COFFEE_SHOP_PRODUCTS: SampleProduct[] = [
  {
    name: 'Espresso',
    description: 'Single shot of rich espresso',
    price: 2.99,
    cost: 0.50,
    categoryName: 'Coffee',
    trackStock: false,
  },
  {
    name: 'Cappuccino',
    description: 'Espresso with steamed milk and foam',
    price: 4.49,
    cost: 0.80,
    categoryName: 'Coffee',
    trackStock: false,
  },
  {
    name: 'Latte',
    description: 'Espresso with steamed milk',
    price: 4.99,
    cost: 0.90,
    categoryName: 'Coffee',
    trackStock: false,
  },
  {
    name: 'Croissant',
    description: 'Fresh buttery croissant',
    price: 3.49,
    cost: 1.20,
    categoryName: 'Pastries',
    trackStock: true,
    stock: 30,
  },
  {
    name: 'Blueberry Muffin',
    description: 'Homemade blueberry muffin',
    price: 3.99,
    cost: 1.50,
    categoryName: 'Pastries',
    trackStock: true,
    stock: 25,
  },
  {
    name: 'Iced Tea',
    description: 'Refreshing iced tea',
    price: 2.99,
    cost: 0.60,
    categoryName: 'Beverages',
    trackStock: false,
  },
]

const RETAIL_PRODUCTS: SampleProduct[] = [
  {
    name: 'T-Shirt',
    description: 'Cotton t-shirt, various sizes',
    price: 19.99,
    cost: 8.00,
    categoryName: 'Clothing',
    trackStock: true,
    stock: 50,
    sku: 'TSH-001',
  },
  {
    name: 'Jeans',
    description: 'Denim jeans, various sizes',
    price: 49.99,
    cost: 20.00,
    categoryName: 'Clothing',
    trackStock: true,
    stock: 30,
    sku: 'JNS-001',
  },
  {
    name: 'Sneakers',
    description: 'Comfortable sneakers',
    price: 79.99,
    cost: 35.00,
    categoryName: 'Footwear',
    trackStock: true,
    stock: 20,
    sku: 'SNK-001',
  },
  {
    name: 'Backpack',
    description: 'Durable backpack',
    price: 39.99,
    cost: 15.00,
    categoryName: 'Accessories',
    trackStock: true,
    stock: 15,
    sku: 'BKP-001',
  },
  {
    name: 'Water Bottle',
    description: 'Reusable water bottle',
    price: 12.99,
    cost: 5.00,
    categoryName: 'Accessories',
    trackStock: true,
    stock: 40,
    sku: 'WTR-001',
  },
]

const TAKEAWAY_PRODUCTS: SampleProduct[] = [
  {
    name: 'Burger Combo',
    description: 'Burger with fries and drink',
    price: 9.99,
    cost: 3.50,
    categoryName: 'Combos',
    trackStock: false,
  },
  {
    name: 'Chicken Wings',
    description: '6 pieces with sauce',
    price: 7.99,
    cost: 3.00,
    categoryName: 'Appetizers',
    trackStock: false,
  },
  {
    name: 'French Fries',
    description: 'Crispy golden fries',
    price: 3.49,
    cost: 1.00,
    categoryName: 'Sides',
    trackStock: false,
  },
  {
    name: 'Soft Drink',
    description: 'Canned soft drink',
    price: 1.99,
    cost: 0.50,
    categoryName: 'Beverages',
    trackStock: true,
    stock: 100,
  },
  {
    name: 'Pizza Slice',
    description: 'Large pizza slice',
    price: 3.99,
    cost: 1.50,
    categoryName: 'Main Course',
    trackStock: false,
  },
]

/**
 * Get sample products based on business type
 */
function getSampleProducts(businessType: BusinessType): SampleProduct[] {
  switch (businessType) {
    case 'RESTAURANT':
      return RESTAURANT_PRODUCTS
    case 'COFFEE_SHOP':
      return COFFEE_SHOP_PRODUCTS
    case 'RETAIL':
      return RETAIL_PRODUCTS
    case 'TAKEAWAY':
      return TAKEAWAY_PRODUCTS
    case 'MIXED':
      // Combine restaurant and coffee shop products
      return [...RESTAURANT_PRODUCTS.slice(0, 3), ...COFFEE_SHOP_PRODUCTS.slice(0, 3)]
    default:
      return RETAIL_PRODUCTS
  }
}

/**
 * Seed a new tenant with sample inventory
 */
export async function seedTenantInventory(tenantId: string, businessType: BusinessType, adminUserId: string) {
  const sampleProducts = getSampleProducts(businessType)

  // Group products by category
  const categoriesMap = new Map<string, SampleProduct[]>()
  sampleProducts.forEach((product) => {
    if (!categoriesMap.has(product.categoryName)) {
      categoriesMap.set(product.categoryName, [])
    }
    categoriesMap.get(product.categoryName)!.push(product)
  })

  // Create categories and products
  let sortOrder = 0
  for (const [categoryName, products] of Array.from(categoriesMap.entries())) {
    // Create category
    const category = await prisma.categories.create({
      data: {
        id: nanoid(),
        tenantId,
        name: categoryName,
        description: `${categoryName} category`,
        sortOrder: sortOrder++,
        updatedAt: new Date(),
      },
    })

    // Create products for this category
    for (const product of products) {
      await prisma.products.create({
        data: {
          id: nanoid(),
          tenantId,
          name: product.name,
          description: product.description,
          price: product.price,
          cost: product.cost,
          categoryId: category.id,
          trackStock: product.trackStock,
          stock: product.stock || 0,
          sku: product.sku,
          isActive: true,
          isFavorite: false,
          createdById: adminUserId,
          lowStockAlert: product.trackStock ? 10 : undefined,
          updatedAt: new Date(),
        },
      })
    }
  }

  return {
    categoriesCreated: categoriesMap.size,
    productsCreated: sampleProducts.length,
  }
}

/**
 * Create sample tables for restaurant/coffee shop
 */
export async function seedTenantTables(tenantId: string, businessType: BusinessType) {
  if (businessType !== 'RESTAURANT' && businessType !== 'COFFEE_SHOP' && businessType !== 'MIXED') {
    return { tablesCreated: 0 }
  }

  const tableCount = businessType === 'COFFEE_SHOP' ? 8 : 12
  const tables = []

  for (let i = 1; i <= tableCount; i++) {
    tables.push({
      id: nanoid(),
      tenantId,
      name: `Table ${i}`,
      capacity: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
      status: 'AVAILABLE' as const,
      updatedAt: new Date(),
    })
  }

  await prisma.tables.createMany({
    data: tables,
  })

  return { tablesCreated: tables.length }
}

/**
 * Create sample customers
 */
export async function seedSampleCustomers(tenantId: string) {
  const customers = [
    {
      tenantId,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0101',
      loyaltyPoints: 150,
      totalSpent: 450.50,
      visitCount: 15,
    },
    {
      tenantId,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-0102',
      loyaltyPoints: 300,
      totalSpent: 890.75,
      visitCount: 28,
    },
    {
      tenantId,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '555-0103',
      loyaltyPoints: 75,
      totalSpent: 210.00,
      visitCount: 8,
    },
  ]

  await prisma.customers.createMany({
    data: customers,
  })

  return { customersCreated: customers.length }
}
