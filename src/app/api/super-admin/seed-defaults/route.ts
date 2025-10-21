import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const baselineFeatures = [
      { featureKey: 'enable_pos_interface', name: 'POS Interface', description: 'Core POS with checkout', category: 'CORE_POS', minimumPlan: 'BASIC', isCore: true, sortOrder: 1 },
      { featureKey: 'enable_quick_checkout', name: 'Quick Checkout Mode', description: 'Streamlined checkout for busy counters', category: 'CORE_POS', minimumPlan: 'BASIC', sortOrder: 2, dependsOn: ['enable_pos_interface'] },
      { featureKey: 'enable_barcode_scanning', name: 'Barcode Scanning', description: 'Scan product barcodes with camera or scanner', category: 'CORE_POS', minimumPlan: 'BASIC', sortOrder: 3, dependsOn: ['enable_pos_interface'] },
      { featureKey: 'enable_inventory_tracking', name: 'Inventory Tracking', description: 'Track stock levels and depletions', category: 'INVENTORY', minimumPlan: 'BASIC', sortOrder: 10 },
      { featureKey: 'enable_low_stock_alerts', name: 'Low Stock Alerts', description: 'Notify staff when products run low', category: 'INVENTORY', minimumPlan: 'BASIC', sortOrder: 11, dependsOn: ['enable_inventory_tracking'] },
      { featureKey: 'enable_order_history', name: 'Order History', description: 'Search and review past orders', category: 'ORDER_MANAGEMENT', minimumPlan: 'BASIC', sortOrder: 20 },
      { featureKey: 'enable_order_modifiers', name: 'Order Modifiers', description: 'Add modifiers and options during checkout', category: 'ORDER_MANAGEMENT', minimumPlan: 'BASIC', sortOrder: 21, dependsOn: ['enable_pos_interface'] },
      { featureKey: 'enable_table_management', name: 'Table Management', description: 'Manage dining room tables and statuses', category: 'TABLE_MANAGEMENT', minimumPlan: 'BASIC', sortOrder: 30 },
      { featureKey: 'enable_table_reservations', name: 'Reservations', description: 'Accept and manage table reservations', category: 'TABLE_MANAGEMENT', minimumPlan: 'BASIC', sortOrder: 31, dependsOn: ['enable_table_management'] },
      { featureKey: 'enable_waitlist', name: 'Waitlist Management', description: 'Track waiting guests and availability', category: 'TABLE_MANAGEMENT', minimumPlan: 'BASIC', sortOrder: 32, dependsOn: ['enable_table_management'] },
      { featureKey: 'enable_kitchen_display', name: 'Kitchen Display', description: 'Send orders to a KDS screen', category: 'KITCHEN_OPERATIONS', minimumPlan: 'BASIC', sortOrder: 40 },
      { featureKey: 'enable_online_ordering', name: 'Online Ordering', description: 'Accept pickup and delivery orders online', category: 'ONLINE_ORDERING', minimumPlan: 'BASIC', sortOrder: 50 },
      { featureKey: 'enable_qr_menu', name: 'QR Menu Ordering', description: 'Allow guests to scan and order from a QR menu', category: 'ONLINE_ORDERING', minimumPlan: 'BASIC', sortOrder: 51, dependsOn: ['enable_online_ordering'] },
      { featureKey: 'enable_delivery_management', name: 'Delivery Management', description: 'Manage in-house delivery orders and drivers', category: 'DELIVERY_MANAGEMENT', minimumPlan: 'BASIC', sortOrder: 60, dependsOn: ['enable_online_ordering'] },
      { featureKey: 'enable_loyalty_program', name: 'Loyalty Program', description: 'Track customer loyalty points', category: 'CUSTOMER_MANAGEMENT', minimumPlan: 'BASIC', sortOrder: 70 },
      { featureKey: 'enable_customer_profiles', name: 'Customer Profiles', description: 'Store customer preferences and history', category: 'CUSTOMER_MANAGEMENT', minimumPlan: 'BASIC', sortOrder: 71 },
      { featureKey: 'enable_staff_scheduling', name: 'Staff Scheduling', description: 'Create and manage staff rotas', category: 'STAFF_MANAGEMENT', minimumPlan: 'BASIC', sortOrder: 80 },
      { featureKey: 'enable_cash_payments', name: 'Cash Payments', description: 'Accept cash payments', category: 'PAYMENT_PROCESSING', minimumPlan: 'BASIC', sortOrder: 90 },
      { featureKey: 'enable_card_payments', name: 'Card Payments', description: 'Accept card and digital wallet payments', category: 'PAYMENT_PROCESSING', minimumPlan: 'BASIC', sortOrder: 91 },
      { featureKey: 'enable_basic_reports', name: 'Basic Reports', description: 'Sales and operational reporting', category: 'ANALYTICS_REPORTS', minimumPlan: 'BASIC', sortOrder: 100 },
    ]

    for (const feature of baselineFeatures) {
      await prisma.feature_catalog.upsert({
        where: { featureKey: feature.featureKey },
        update: {
          name: feature.name,
          description: feature.description,
          category: feature.category as any,
          icon: null,
          requiresUpgrade: false,
          minimumPlan: feature.minimumPlan as any,
          dependsOn: feature.dependsOn ? (feature.dependsOn as any) : undefined,
          sortOrder: feature.sortOrder,
          isCore: !!feature.isCore,
          isBeta: false,
        },
        create: {
          featureKey: feature.featureKey,
          name: feature.name,
          description: feature.description,
          category: feature.category as any,
          icon: null,
          requiresUpgrade: false,
          minimumPlan: feature.minimumPlan as any,
          dependsOn: feature.dependsOn ? (feature.dependsOn as any) : undefined,
          sortOrder: feature.sortOrder,
          isCore: !!feature.isCore,
          isBeta: false,
        },
      })
    }

    const templates = [
      {
        typeKey: 'coffee_shop_takeaway',
        name: 'Coffee Shop (Takeaway)',
        displayName: 'Coffee Shop - Takeaway Only',
        description: 'Quick counter service with loyalty and online ordering add-ons',
        category: 'BEVERAGE',
        hasDineIn: false,
        hasTakeaway: true,
        hasDelivery: false,
        hasKitchen: false,
        requiresTable: false,
        isActive: true,
        isPopular: true,
        recommendedPlan: 'BASIC',
        featureKeys: [
          'enable_pos_interface',
          'enable_quick_checkout',
          'enable_order_history',
          'enable_inventory_tracking',
          'enable_low_stock_alerts',
          'enable_loyalty_program',
          'enable_customer_profiles',
          'enable_cash_payments',
          'enable_card_payments',
          'enable_basic_reports',
        ],
      },
      {
        typeKey: 'restaurant_full_service',
        name: 'Full-Service Restaurant',
        displayName: 'Full-Service Dine-In Restaurant',
        description: 'Table, kitchen, and online ordering workflows for dine-in venues',
        category: 'FOOD_SERVICE',
        hasDineIn: true,
        hasTakeaway: true,
        hasDelivery: true,
        hasKitchen: true,
        requiresTable: true,
        isActive: true,
        isPopular: true,
        recommendedPlan: 'BASIC',
        featureKeys: [
          'enable_pos_interface',
          'enable_order_history',
          'enable_order_modifiers',
          'enable_table_management',
          'enable_table_reservations',
          'enable_waitlist',
          'enable_kitchen_display',
          'enable_inventory_tracking',
          'enable_online_ordering',
          'enable_qr_menu',
          'enable_delivery_management',
          'enable_customer_profiles',
          'enable_cash_payments',
          'enable_card_payments',
          'enable_basic_reports',
          'enable_staff_scheduling',
        ],
      },
      {
        typeKey: 'retail_store',
        name: 'Retail Store',
        displayName: 'Retail / Convenience Store',
        description: 'Inventory-heavy workflows with barcode scanning and alerts',
        category: 'RETAIL',
        hasDineIn: false,
        hasTakeaway: false,
        hasDelivery: false,
        hasKitchen: false,
        requiresTable: false,
        isActive: true,
        isPopular: false,
        recommendedPlan: 'BASIC',
        featureKeys: [
          'enable_pos_interface',
          'enable_quick_checkout',
          'enable_barcode_scanning',
          'enable_order_history',
          'enable_inventory_tracking',
          'enable_low_stock_alerts',
          'enable_customer_profiles',
          'enable_cash_payments',
          'enable_card_payments',
          'enable_basic_reports',
        ],
      },
    ]

    for (const templateDef of templates) {
      const template = await prisma.business_type_templates.upsert({
        where: { typeKey: templateDef.typeKey },
        update: {
          name: templateDef.name,
          displayName: templateDef.displayName,
          description: templateDef.description,
          category: templateDef.category as any,
          hasDineIn: templateDef.hasDineIn,
          hasTakeaway: templateDef.hasTakeaway,
          hasDelivery: templateDef.hasDelivery,
          hasKitchen: templateDef.hasKitchen,
          requiresTable: templateDef.requiresTable,
          isActive: templateDef.isActive,
          isPopular: templateDef.isPopular,
          recommendedPlan: templateDef.recommendedPlan as any,
        },
        create: {
          typeKey: templateDef.typeKey,
          name: templateDef.name,
          displayName: templateDef.displayName,
          description: templateDef.description,
          category: templateDef.category as any,
          hasDineIn: templateDef.hasDineIn,
          hasTakeaway: templateDef.hasTakeaway,
          hasDelivery: templateDef.hasDelivery,
          hasKitchen: templateDef.hasKitchen,
          requiresTable: templateDef.requiresTable,
          isActive: templateDef.isActive,
          isPopular: templateDef.isPopular,
          recommendedPlan: templateDef.recommendedPlan as any,
        },
      })

      for (const key of templateDef.featureKeys) {
        const feature = await prisma.feature_catalog.findUnique({ where: { featureKey: key } })
        if (!feature) continue
        await prisma.template_features.upsert({
          where: { templateId_featureId: { templateId: template.id, featureId: feature.id } },
          update: { isEnabledByDefault: true, isRecommended: true, isRequired: key === 'enable_pos_interface' },
          create: {
            templateId: template.id,
            featureId: feature.id,
            isEnabledByDefault: true,
            isRecommended: true,
            isRequired: key === 'enable_pos_interface',
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Seed defaults error:', error)
    return NextResponse.json({ error: 'Failed to seed defaults' }, { status: 500 })
  }
}
