/**
 * Script to add default categories to existing tenants
 * Run with: npx tsx scripts/add-default-categories.ts
 */

import { PrismaClient, BusinessType } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

/**
 * Get default category names based on business type
 */
function getDefaultCategories(businessType: BusinessType): string[] {
  switch (businessType) {
    case 'RESTAURANT':
      return ['Appetizers', 'Main Course', 'Sides', 'Desserts', 'Beverages']
    case 'COFFEE_SHOP':
      return ['Coffee', 'Tea', 'Pastries', 'Sandwiches', 'Beverages']
    case 'RETAIL':
      return ['Clothing', 'Footwear', 'Accessories', 'Electronics', 'Home & Living']
    case 'TAKEAWAY':
      return ['Combos', 'Main Course', 'Sides', 'Appetizers', 'Beverages', 'Desserts']
    case 'MIXED':
      return ['Food', 'Beverages', 'Desserts', 'Retail Items', 'Specials']
    default:
      return ['General', 'Products', 'Services']
  }
}

async function addDefaultCategoriesToTenant(tenantId: string, tenantName: string, businessType: BusinessType) {
  // Check existing categories
  const existingCategories = await prisma.categories.findMany({
    where: { tenantId },
  })

  console.log(`\n📋 Processing: ${tenantName} (${businessType})`)
  console.log(`   Existing categories: ${existingCategories.length}`)

  const defaultCategoryNames = getDefaultCategories(businessType)
  const existingCategoryNames = new Set(existingCategories.map(c => c.name.toLowerCase()))

  // Find categories that need to be added
  const categoriesToAdd = defaultCategoryNames.filter(
    name => !existingCategoryNames.has(name.toLowerCase())
  )

  if (categoriesToAdd.length === 0) {
    console.log(`   ✅ Already has all default categories`)
    return 0
  }

  // Get the highest sort order
  const maxSortOrder = existingCategories.length > 0
    ? Math.max(...existingCategories.map(c => c.sortOrder))
    : -1

  // Create new categories
  const newCategories = []
  for (let i = 0; i < categoriesToAdd.length; i++) {
    newCategories.push({
      id: nanoid(),
      tenantId,
      name: categoriesToAdd[i],
      sortOrder: maxSortOrder + i + 1,
      updatedAt: new Date(),
    })
  }

  await prisma.categories.createMany({
    data: newCategories,
  })

  console.log(`   ✨ Added ${newCategories.length} new categories: ${categoriesToAdd.join(', ')}`)
  return newCategories.length
}

async function main() {
  console.log('🚀 Adding default categories to existing tenants...\n')

  // Get all tenants
  const tenants = await prisma.tenants.findMany({
    select: {
      id: true,
      name: true,
      subdomain: true,
      businessType: true,
    },
  })

  console.log(`Found ${tenants.length} tenant(s)`)

  let totalAdded = 0
  for (const tenant of tenants) {
    const added = await addDefaultCategoriesToTenant(
      tenant.id,
      tenant.name,
      tenant.businessType
    )
    totalAdded += added
  }

  console.log(`\n✅ Done! Added ${totalAdded} categories in total`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

