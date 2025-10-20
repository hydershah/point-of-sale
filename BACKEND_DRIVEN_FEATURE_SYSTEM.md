# Backend-Driven Business Type & Feature System

## Architecture Overview

### Design Principles
1. **Backend-Driven**: All business types and features defined in database
2. **Intelligent Defaults**: Smart feature selection based on business type
3. **Owner Customization**: Tenants can enable/disable features in settings
4. **Scalable**: Super admin can add new business types without code changes
5. **Dependency-Aware**: Features can depend on other features

---

## Database Schema

### 1. Feature Catalog (Master List of All Features)

```prisma
model feature_catalog {
  id                  String    @id @default(cuid())
  featureKey          String    @unique  // e.g., "enable_table_management"
  name                String              // e.g., "Table Management"
  description         String              // e.g., "Manage restaurant tables, assignments, and status"
  category            FeatureCategory

  // Feature metadata
  icon                String?             // Icon name for UI
  requiresUpgrade     Boolean   @default(false)  // Requires higher subscription tier
  minimumPlan         SubscriptionPlan?   // BASIC, PRO, ENTERPRISE

  // Dependencies
  dependsOn           Json?               // Array of featureKeys this depends on
  conflictsWith       Json?               // Array of featureKeys this conflicts with

  // UI grouping
  sortOrder           Int       @default(0)
  isCore              Boolean   @default(false)  // Core features (always visible)
  isBeta              Boolean   @default(false)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  template_features   template_features[]
  tenant_features     tenant_features[]

  @@index([category])
  @@index([minimumPlan])
}

enum FeatureCategory {
  CORE_POS
  INVENTORY
  CUSTOMER_MANAGEMENT
  ORDER_MANAGEMENT
  TABLE_MANAGEMENT
  KITCHEN_OPERATIONS
  STAFF_MANAGEMENT
  PAYMENT_PROCESSING
  DISCOUNTS_PROMOTIONS
  MULTI_LOCATION
  ANALYTICS_REPORTS
  HARDWARE_INTEGRATION
  ONLINE_ORDERING
  DELIVERY_MANAGEMENT
  MARKETING
  COMPLIANCE_SECURITY
}
```

### 2. Business Type Templates

```prisma
model business_type_templates {
  id                  String    @id @default(cuid())
  typeKey             String    @unique  // e.g., "coffee_shop_takeaway"
  name                String              // e.g., "Coffee Shop (Takeaway)"
  displayName         String              // e.g., "Coffee Shop - Takeaway Only"
  description         String              // Detailed description for onboarding

  // Categorization
  category            BusinessCategory
  subcategory         String?

  // Business characteristics
  hasDineIn           Boolean   @default(false)
  hasTakeaway         Boolean   @default(true)
  hasDelivery         Boolean   @default(false)
  hasKitchen          Boolean   @default(false)
  requiresTable       Boolean   @default(false)
  typicalOrderTime    Int?                // Average order time in minutes

  // Visual
  icon                String?             // Icon for selection
  color               String?             // Brand color
  imageUrl            String?             // Template image

  // Metadata
  isActive            Boolean   @default(true)
  isPopular           Boolean   @default(false)  // Show in "popular" section
  sortOrder           Int       @default(0)
  tags                Json?               // ["fast-service", "beverages", "food"]

  // Recommendations
  recommendedPlan     SubscriptionPlan    @default(BASIC)
  expectedDailyOrders Int?                // Help with sizing

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  template_features   template_features[]
  tenants             tenants[]

  @@index([category])
  @@index([isActive, isPopular])
}

enum BusinessCategory {
  FOOD_SERVICE
  BEVERAGE
  RETAIL
  HOSPITALITY
  QUICK_SERVICE
  ENTERTAINMENT
  HEALTHCARE
  SERVICES
  OTHER
}
```

### 3. Template Features (Default Features per Business Type)

```prisma
model template_features {
  id                  String    @id @default(cuid())
  templateId          String
  featureId           String

  // Default state
  isEnabledByDefault  Boolean   @default(true)
  isRecommended       Boolean   @default(false)  // Show badge "Recommended"
  isRequired          Boolean   @default(false)  // Cannot be disabled

  // Configuration
  defaultConfig       Json?               // Default feature config/settings

  createdAt           DateTime  @default(now())

  // Relations
  template            business_type_templates @relation(fields: [templateId], references: [id], onDelete: Cascade)
  feature             feature_catalog         @relation(fields: [featureId], references: [id], onDelete: Cascade)

  @@unique([templateId, featureId])
  @@index([templateId])
  @@index([featureId])
}
```

### 4. Tenant Features (Per-Tenant Overrides)

```prisma
model tenant_features {
  id                  String    @id @default(cuid())
  tenantId            String
  featureId           String

  // Tenant-specific state
  isEnabled           Boolean   @default(true)
  enabledAt           DateTime?
  disabledAt          DateTime?

  // Who made the change
  enabledBy           String?   // userId
  disabledBy          String?   // userId

  // Configuration
  config              Json?               // Tenant-specific config for this feature

  // Usage tracking (optional - for analytics)
  lastUsedAt          DateTime?
  usageCount          Int       @default(0)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  tenant              tenants           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  feature             feature_catalog   @relation(fields: [featureId], references: [id], onDelete: Cascade)

  @@unique([tenantId, featureId])
  @@index([tenantId, isEnabled])
  @@index([featureId])
}
```

### 5. Update Existing Models

```prisma
model tenants {
  // ... existing fields ...

  businessTemplateId  String?
  businessTemplate    business_type_templates? @relation(fields: [businessTemplateId], references: [id])

  tenant_features     tenant_features[]

  // Remove old businessType field - now using template
}
```

---

## Intelligent Feature Matrix

### Feature Catalog (All Available Features)

#### CORE_POS Features
```typescript
{
  featureKey: "enable_pos_interface",
  name: "Point of Sale Interface",
  description: "Core POS with product selection and checkout",
  category: "CORE_POS",
  isCore: true,
  minimumPlan: "BASIC",
  dependsOn: []
}

{
  featureKey: "enable_quick_checkout",
  name: "Quick Checkout Mode",
  description: "Fast checkout with minimal clicks for high-volume businesses",
  category: "CORE_POS",
  isCore: false,
  minimumPlan: "BASIC",
  dependsOn: ["enable_pos_interface"]
}

{
  featureKey: "enable_barcode_scanning",
  name: "Barcode Scanning",
  description: "Scan product barcodes for fast item entry",
  category: "CORE_POS",
  minimumPlan: "BASIC",
  dependsOn: ["enable_pos_interface"]
}
```

#### INVENTORY Features
```typescript
{
  featureKey: "enable_inventory_tracking",
  name: "Inventory Tracking",
  description: "Track stock levels automatically on sales",
  category: "INVENTORY",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_low_stock_alerts",
  name: "Low Stock Alerts",
  description: "Get notified when products run low",
  category: "INVENTORY",
  minimumPlan: "BASIC",
  dependsOn: ["enable_inventory_tracking"]
}

{
  featureKey: "enable_supplier_management",
  name: "Supplier Management",
  description: "Manage suppliers, contacts, and pricing",
  category: "INVENTORY",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_purchase_orders",
  name: "Purchase Orders",
  description: "Create and track purchase orders to suppliers",
  category: "INVENTORY",
  minimumPlan: "PRO",
  dependsOn: ["enable_supplier_management", "enable_inventory_tracking"]
}

{
  featureKey: "enable_recipe_management",
  name: "Recipe & Ingredient Tracking",
  description: "Track ingredients used in each menu item",
  category: "INVENTORY",
  minimumPlan: "PRO",
  dependsOn: ["enable_inventory_tracking"]
}

{
  featureKey: "enable_waste_tracking",
  name: "Waste Tracking",
  description: "Record expired, damaged, or wasted inventory",
  category: "INVENTORY",
  minimumPlan: "PRO",
  dependsOn: ["enable_inventory_tracking"]
}

{
  featureKey: "enable_batch_expiry",
  name: "Batch & Expiry Tracking",
  description: "Track batch numbers and expiration dates",
  category: "INVENTORY",
  minimumPlan: "PRO",
  dependsOn: ["enable_inventory_tracking"]
}
```

#### ORDER_MANAGEMENT Features
```typescript
{
  featureKey: "enable_order_history",
  name: "Order History",
  description: "View and search past orders",
  category: "ORDER_MANAGEMENT",
  isCore: true,
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_order_notes",
  name: "Order Notes",
  description: "Add special instructions to orders",
  category: "ORDER_MANAGEMENT",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_order_modifiers",
  name: "Product Modifiers",
  description: "Customize products (size, extras, removals)",
  category: "ORDER_MANAGEMENT",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_combo_meals",
  name: "Combo Meals & Bundles",
  description: "Create meal deals and product bundles",
  category: "ORDER_MANAGEMENT",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_order_scheduling",
  name: "Order Scheduling",
  description: "Accept orders for future pickup/delivery",
  category: "ORDER_MANAGEMENT",
  minimumPlan: "PRO"
}
```

#### TABLE_MANAGEMENT Features
```typescript
{
  featureKey: "enable_table_management",
  name: "Table Management",
  description: "Track table status and assignments",
  category: "TABLE_MANAGEMENT",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_floor_plan",
  name: "Visual Floor Plan",
  description: "Visual table layout and status",
  category: "TABLE_MANAGEMENT",
  minimumPlan: "PRO",
  dependsOn: ["enable_table_management"]
}

{
  featureKey: "enable_table_reservations",
  name: "Reservations",
  description: "Accept and manage table reservations",
  category: "TABLE_MANAGEMENT",
  minimumPlan: "PRO",
  dependsOn: ["enable_table_management"]
}

{
  featureKey: "enable_waitlist",
  name: "Waitlist Management",
  description: "Manage walk-in customer queue",
  category: "TABLE_MANAGEMENT",
  minimumPlan: "PRO",
  dependsOn: ["enable_table_management"]
}

{
  featureKey: "enable_table_qr_ordering",
  name: "QR Code Table Ordering",
  description: "Customers scan QR to order from table",
  category: "TABLE_MANAGEMENT",
  minimumPlan: "PRO",
  dependsOn: ["enable_table_management"]
}
```

#### KITCHEN_OPERATIONS Features
```typescript
{
  featureKey: "enable_kitchen_display",
  name: "Kitchen Display System (KDS)",
  description: "Real-time order display for kitchen staff",
  category: "KITCHEN_OPERATIONS",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_kitchen_printer",
  name: "Kitchen Printer",
  description: "Print orders directly to kitchen",
  category: "KITCHEN_OPERATIONS",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_prep_stations",
  name: "Prep Station Routing",
  description: "Route orders to specific kitchen stations",
  category: "KITCHEN_OPERATIONS",
  minimumPlan: "PRO",
  dependsOn: ["enable_kitchen_display"]
}

{
  featureKey: "enable_course_management",
  name: "Course Timing",
  description: "Fire appetizers, hold entrees, course sequencing",
  category: "KITCHEN_OPERATIONS",
  minimumPlan: "PRO",
  dependsOn: ["enable_kitchen_display"]
}

{
  featureKey: "enable_prep_lists",
  name: "Prep Lists",
  description: "Generate prep lists for kitchen",
  category: "KITCHEN_OPERATIONS",
  minimumPlan: "PRO"
}
```

#### CUSTOMER_MANAGEMENT Features
```typescript
{
  featureKey: "enable_customer_database",
  name: "Customer Database",
  description: "Store customer information and history",
  category: "CUSTOMER_MANAGEMENT",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_loyalty_program",
  name: "Loyalty Points",
  description: "Earn and redeem loyalty points",
  category: "CUSTOMER_MANAGEMENT",
  minimumPlan: "BASIC",
  dependsOn: ["enable_customer_database"]
}

{
  featureKey: "enable_customer_profiles",
  name: "Customer Profiles",
  description: "Detailed customer preferences and history",
  category: "CUSTOMER_MANAGEMENT",
  minimumPlan: "PRO",
  dependsOn: ["enable_customer_database"]
}

{
  featureKey: "enable_customer_analytics",
  name: "Customer Analytics",
  description: "RFM segmentation, churn prediction, LTV",
  category: "CUSTOMER_MANAGEMENT",
  minimumPlan: "PRO",
  dependsOn: ["enable_customer_database"]
}

{
  featureKey: "enable_birthday_rewards",
  name: "Birthday Rewards",
  description: "Automatic birthday discounts and notifications",
  category: "CUSTOMER_MANAGEMENT",
  minimumPlan: "PRO",
  dependsOn: ["enable_customer_database", "enable_loyalty_program"]
}
```

#### PAYMENT_PROCESSING Features
```typescript
{
  featureKey: "enable_cash_payments",
  name: "Cash Payments",
  description: "Accept cash with change calculation",
  category: "PAYMENT_PROCESSING",
  isCore: true,
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_card_payments",
  name: "Card Payments",
  description: "Accept credit/debit cards",
  category: "PAYMENT_PROCESSING",
  isCore: true,
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_digital_wallet",
  name: "Digital Wallets",
  description: "Accept Apple Pay, Google Pay, etc.",
  category: "PAYMENT_PROCESSING",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_split_payments",
  name: "Split Payments",
  description: "Split bill by person, amount, or item",
  category: "PAYMENT_PROCESSING",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_tipping",
  name: "Tip Processing",
  description: "Add tips to orders",
  category: "PAYMENT_PROCESSING",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_tip_pooling",
  name: "Tip Pooling",
  description: "Distribute tips among staff",
  category: "PAYMENT_PROCESSING",
  minimumPlan: "PRO",
  dependsOn: ["enable_tipping"]
}

{
  featureKey: "enable_auto_gratuity",
  name: "Auto-Gratuity",
  description: "Automatic gratuity for large parties",
  category: "PAYMENT_PROCESSING",
  minimumPlan: "PRO",
  dependsOn: ["enable_tipping"]
}

{
  featureKey: "enable_gift_cards",
  name: "Gift Cards",
  description: "Sell and redeem gift cards",
  category: "PAYMENT_PROCESSING",
  minimumPlan: "PRO"
}
```

#### DISCOUNTS_PROMOTIONS Features
```typescript
{
  featureKey: "enable_manual_discounts",
  name: "Manual Discounts",
  description: "Apply percentage or fixed discounts",
  category: "DISCOUNTS_PROMOTIONS",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_coupon_codes",
  name: "Coupon Codes",
  description: "Create and validate coupon codes",
  category: "DISCOUNTS_PROMOTIONS",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_happy_hour",
  name: "Happy Hour Pricing",
  description: "Time-based automatic discounts",
  category: "DISCOUNTS_PROMOTIONS",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_buy_x_get_y",
  name: "Buy X Get Y Deals",
  description: "BOGO and quantity-based deals",
  category: "DISCOUNTS_PROMOTIONS",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_loyalty_rewards",
  name: "Loyalty Rewards Redemption",
  description: "Redeem points for discounts/free items",
  category: "DISCOUNTS_PROMOTIONS",
  minimumPlan: "PRO",
  dependsOn: ["enable_loyalty_program"]
}
```

#### STAFF_MANAGEMENT Features
```typescript
{
  featureKey: "enable_user_management",
  name: "User Management",
  description: "Add/remove staff with roles",
  category: "STAFF_MANAGEMENT",
  isCore: true,
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_time_clock",
  name: "Time Clock",
  description: "Clock in/out and break tracking",
  category: "STAFF_MANAGEMENT",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_shift_management",
  name: "Shift Management",
  description: "Open/close shifts with cash reconciliation",
  category: "STAFF_MANAGEMENT",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_staff_scheduling",
  name: "Staff Scheduling",
  description: "Weekly schedules and shift assignment",
  category: "STAFF_MANAGEMENT",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_performance_tracking",
  name: "Performance Metrics",
  description: "Track sales per employee",
  category: "STAFF_MANAGEMENT",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_staff_permissions",
  name: "Granular Permissions",
  description: "Detailed permission control per user",
  category: "STAFF_MANAGEMENT",
  minimumPlan: "PRO",
  dependsOn: ["enable_user_management"]
}
```

#### MULTI_LOCATION Features
```typescript
{
  featureKey: "enable_multi_location",
  name: "Multi-Location Support",
  description: "Manage multiple business locations",
  category: "MULTI_LOCATION",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_location_transfers",
  name: "Inventory Transfers",
  description: "Transfer stock between locations",
  category: "MULTI_LOCATION",
  minimumPlan: "PRO",
  dependsOn: ["enable_multi_location", "enable_inventory_tracking"]
}

{
  featureKey: "enable_consolidated_reports",
  name: "Consolidated Reporting",
  description: "View reports across all locations",
  category: "MULTI_LOCATION",
  minimumPlan: "PRO",
  dependsOn: ["enable_multi_location"]
}

{
  featureKey: "enable_centralized_menu",
  name: "Centralized Menu Management",
  description: "Manage menu across all locations",
  category: "MULTI_LOCATION",
  minimumPlan: "ENTERPRISE",
  dependsOn: ["enable_multi_location"]
}
```

#### ONLINE_ORDERING Features
```typescript
{
  featureKey: "enable_online_ordering",
  name: "Online Ordering",
  description: "Customer web/app ordering",
  category: "ONLINE_ORDERING",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_delivery_management",
  name: "Delivery Management",
  description: "Manage own delivery drivers",
  category: "ONLINE_ORDERING",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_third_party_delivery",
  name: "Third-Party Delivery Integration",
  description: "Integrate with UberEats, DoorDash, etc.",
  category: "ONLINE_ORDERING",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_delivery_zones",
  name: "Delivery Zones",
  description: "Set delivery areas and fees",
  category: "ONLINE_ORDERING",
  minimumPlan: "PRO",
  dependsOn: ["enable_delivery_management"]
}
```

#### MARKETING Features
```typescript
{
  featureKey: "enable_email_marketing",
  name: "Email Marketing",
  description: "Send promotional emails to customers",
  category: "MARKETING",
  minimumPlan: "ENTERPRISE",
  dependsOn: ["enable_customer_database"]
}

{
  featureKey: "enable_sms_marketing",
  name: "SMS Marketing",
  description: "Send SMS campaigns to customers",
  category: "MARKETING",
  minimumPlan: "ENTERPRISE",
  dependsOn: ["enable_customer_database"]
}

{
  featureKey: "enable_push_notifications",
  name: "Push Notifications",
  description: "Send app push notifications",
  category: "MARKETING",
  minimumPlan: "ENTERPRISE"
}

{
  featureKey: "enable_referral_program",
  name: "Referral Program",
  description: "Customer referral rewards",
  category: "MARKETING",
  minimumPlan: "PRO",
  dependsOn: ["enable_customer_database"]
}
```

#### ANALYTICS_REPORTS Features
```typescript
{
  featureKey: "enable_basic_reports",
  name: "Basic Reports",
  description: "Sales, orders, and inventory reports",
  category: "ANALYTICS_REPORTS",
  isCore: true,
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_advanced_analytics",
  name: "Advanced Analytics",
  description: "Detailed business intelligence",
  category: "ANALYTICS_REPORTS",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_sales_forecasting",
  name: "Sales Forecasting",
  description: "Predict future sales trends",
  category: "ANALYTICS_REPORTS",
  minimumPlan: "ENTERPRISE"
}

{
  featureKey: "enable_inventory_forecasting",
  name: "Inventory Forecasting",
  description: "Predict inventory needs",
  category: "ANALYTICS_REPORTS",
  minimumPlan: "ENTERPRISE",
  dependsOn: ["enable_inventory_tracking"]
}

{
  featureKey: "enable_menu_engineering",
  name: "Menu Engineering",
  description: "Analyze product profitability",
  category: "ANALYTICS_REPORTS",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_custom_reports",
  name: "Custom Reports",
  description: "Build custom report templates",
  category: "ANALYTICS_REPORTS",
  minimumPlan: "ENTERPRISE"
}
```

#### COMPLIANCE_SECURITY Features
```typescript
{
  featureKey: "enable_audit_logs",
  name: "Audit Logs",
  description: "Track all system actions",
  category: "COMPLIANCE_SECURITY",
  isCore: true,
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_void_approval",
  name: "Void Approval",
  description: "Require manager approval to void items",
  category: "COMPLIANCE_SECURITY",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_refund_approval",
  name: "Refund Approval",
  description: "Require manager approval for refunds",
  category: "COMPLIANCE_SECURITY",
  minimumPlan: "BASIC"
}

{
  featureKey: "enable_discount_approval",
  name: "Discount Approval",
  description: "Require approval for discounts over threshold",
  category: "COMPLIANCE_SECURITY",
  minimumPlan: "PRO"
}

{
  featureKey: "enable_cash_drawer_management",
  name: "Cash Drawer Management",
  description: "Track cash drawer open/close events",
  category: "COMPLIANCE_SECURITY",
  minimumPlan: "BASIC"
}
```

---

## Business Type Templates (Intelligent Defaults)

### 1. Coffee Shop - Takeaway Only
```typescript
{
  typeKey: "coffee_shop_takeaway",
  name: "Coffee Shop (Takeaway)",
  displayName: "Coffee Shop - Takeaway Only",
  description: "Perfect for coffee shops focused on grab-and-go service",
  category: "BEVERAGE",
  subcategory: "Coffee",

  hasDineIn: false,
  hasTakeaway: true,
  hasDelivery: false,
  hasKitchen: false,
  requiresTable: false,
  typicalOrderTime: 3,  // 3 minutes

  recommendedPlan: "BASIC",
  expectedDailyOrders: 200,

  features: [
    // CORE (Required)
    { featureKey: "enable_pos_interface", isRequired: true },
    { featureKey: "enable_quick_checkout", isRequired: true },  // Fast service!
    { featureKey: "enable_order_history", isRequired: true },

    // HIGHLY RECOMMENDED
    { featureKey: "enable_order_modifiers", isRecommended: true },  // Size, milk, shots
    { featureKey: "enable_customer_database", isRecommended: true },
    { featureKey: "enable_loyalty_program", isRecommended: true },  // Coffee loyalty is huge
    { featureKey: "enable_inventory_tracking", isRecommended: true },
    { featureKey: "enable_low_stock_alerts", isRecommended: true },

    // RECOMMENDED
    { featureKey: "enable_order_notes", isRecommended: false },
    { featureKey: "enable_manual_discounts", isRecommended: false },
    { featureKey: "enable_coupon_codes", isRecommended: false },
    { featureKey: "enable_cash_payments", isRecommended: true },
    { featureKey: "enable_card_payments", isRecommended: true },
    { featureKey: "enable_digital_wallet", isRecommended: true },
    { featureKey: "enable_basic_reports", isRecommended: true },

    // OPTIONAL
    { featureKey: "enable_tipping", isRecommended: false },
    { featureKey: "enable_customer_profiles", isRecommended: false },
    { featureKey: "enable_birthday_rewards", isRecommended: false },
    { featureKey: "enable_user_management", isRecommended: true },
    { featureKey: "enable_shift_management", isRecommended: false },
  ]
}
```

### 2. Kebab Shop - Takeaway & Delivery
```typescript
{
  typeKey: "kebab_shop_takeaway",
  name: "Kebab Shop (Takeaway & Delivery)",
  displayName: "Kebab/Fast Food Takeaway",
  description: "Fast food takeaway with delivery service",
  category: "FOOD_SERVICE",
  subcategory: "Quick Service",

  hasDineIn: false,
  hasTakeaway: true,
  hasDelivery: true,
  hasKitchen: true,
  requiresTable: false,
  typicalOrderTime: 15,  // 15 minutes

  recommendedPlan: "BASIC",
  expectedDailyOrders: 150,

  features: [
    // CORE
    { featureKey: "enable_pos_interface", isRequired: true },
    { featureKey: "enable_order_history", isRequired: true },

    // HIGHLY RECOMMENDED
    { featureKey: "enable_kitchen_display", isRecommended: true },  // Kitchen needs to see orders
    { featureKey: "enable_order_modifiers", isRecommended: true },  // Extra sauce, no onions
    { featureKey: "enable_order_notes", isRecommended: true },  // Special instructions
    { featureKey: "enable_inventory_tracking", isRecommended: true },
    { featureKey: "enable_low_stock_alerts", isRecommended: true },
    { featureKey: "enable_customer_database", isRecommended: true },
    { featureKey: "enable_delivery_management", isRecommended: true },  // Own drivers

    // RECOMMENDED
    { featureKey: "enable_manual_discounts", isRecommended: false },
    { featureKey: "enable_coupon_codes", isRecommended: false },
    { featureKey: "enable_combo_meals", isRecommended: false },  // Meal deals
    { featureKey: "enable_cash_payments", isRecommended: true },
    { featureKey: "enable_card_payments", isRecommended: true },
    { featureKey: "enable_online_ordering", isRecommended: false },
    { featureKey: "enable_basic_reports", isRecommended: true },

    // OPTIONAL
    { featureKey: "enable_loyalty_program", isRecommended: false },
    { featureKey: "enable_kitchen_printer", isRecommended: false },
    { featureKey: "enable_user_management", isRecommended: true },
    { featureKey: "enable_shift_management", isRecommended: false },
  ]
}
```

### 3. Full-Service Dine-In Restaurant
```typescript
{
  typeKey: "restaurant_full_service",
  name: "Full-Service Restaurant",
  displayName: "Full-Service Dine-In Restaurant",
  description: "Traditional restaurant with table service and full menu",
  category: "FOOD_SERVICE",
  subcategory: "Casual Dining",

  hasDineIn: true,
  hasTakeaway: true,
  hasDelivery: false,
  hasKitchen: true,
  requiresTable: true,
  typicalOrderTime: 30,

  recommendedPlan: "PRO",
  expectedDailyOrders: 100,

  features: [
    // CORE
    { featureKey: "enable_pos_interface", isRequired: true },
    { featureKey: "enable_order_history", isRequired: true },
    { featureKey: "enable_table_management", isRequired: true },  // Essential!

    // HIGHLY RECOMMENDED
    { featureKey: "enable_kitchen_display", isRecommended: true },
    { featureKey: "enable_order_modifiers", isRecommended: true },
    { featureKey: "enable_order_notes", isRecommended: true },
    { featureKey: "enable_split_payments", isRecommended: true },  // Groups split bills
    { featureKey: "enable_tipping", isRecommended: true },  // Waiters get tips
    { featureKey: "enable_inventory_tracking", isRecommended: true },
    { featureKey: "enable_customer_database", isRecommended: true },
    { featureKey: "enable_user_management", isRecommended: true },

    // RECOMMENDED
    { featureKey: "enable_table_reservations", isRecommended: false },
    { featureKey: "enable_waitlist", isRecommended: false },
    { featureKey: "enable_course_management", isRecommended: false },  // Fire apps, hold entrees
    { featureKey: "enable_floor_plan", isRecommended: false },
    { featureKey: "enable_manual_discounts", isRecommended: false },
    { featureKey: "enable_auto_gratuity", isRecommended: false },  // For large parties
    { featureKey: "enable_shift_management", isRecommended: false },
    { featureKey: "enable_time_clock", isRecommended: false },
    { featureKey: "enable_tip_pooling", isRecommended: false },
    { featureKey: "enable_kitchen_printer", isRecommended: false },
    { featureKey: "enable_prep_stations", isRecommended: false },

    // OPTIONAL
    { featureKey: "enable_loyalty_program", isRecommended: false },
    { featureKey: "enable_recipe_management", isRecommended: false },
    { featureKey: "enable_waste_tracking", isRecommended: false },
    { featureKey: "enable_supplier_management", isRecommended: false },
    { featureKey: "enable_advanced_analytics", isRecommended: false },
    { featureKey: "enable_menu_engineering", isRecommended: false },
  ]
}
```

### 4. Pizza Takeaway & Delivery
```typescript
{
  typeKey: "pizza_takeaway_delivery",
  name: "Pizza Takeaway & Delivery",
  displayName: "Pizza Shop - Takeaway & Delivery",
  description: "Pizza restaurant focused on takeaway and delivery orders",
  category: "FOOD_SERVICE",
  subcategory: "Pizza",

  hasDineIn: false,
  hasTakeaway: true,
  hasDelivery: true,
  hasKitchen: true,
  requiresTable: false,
  typicalOrderTime: 25,

  recommendedPlan: "PRO",
  expectedDailyOrders: 120,

  features: [
    // CORE
    { featureKey: "enable_pos_interface", isRequired: true },
    { featureKey: "enable_order_history", isRequired: true },

    // HIGHLY RECOMMENDED
    { featureKey: "enable_kitchen_display", isRecommended: true },
    { featureKey: "enable_order_modifiers", isRecommended: true },  // Toppings!
    { featureKey: "enable_order_notes", isRecommended: true },
    { featureKey: "enable_customer_database", isRecommended: true },
    { featureKey: "enable_online_ordering", isRecommended: true },  // Critical for pizza
    { featureKey: "enable_delivery_management", isRecommended: true },
    { featureKey: "enable_delivery_zones", isRecommended: true },
    { featureKey: "enable_order_scheduling", isRecommended: true },  // "Deliver at 7pm"

    // RECOMMENDED
    { featureKey: "enable_combo_meals", isRecommended: false },  // Pizza + sides deals
    { featureKey: "enable_inventory_tracking", isRecommended: false },
    { featureKey: "enable_coupon_codes", isRecommended: false },  // Pizza coupons
    { featureKey: "enable_loyalty_program", isRecommended: false },
    { featureKey: "enable_manual_discounts", isRecommended: false },
    { featureKey: "enable_user_management", isRecommended: true },

    // OPTIONAL
    { featureKey: "enable_recipe_management", isRecommended: false },
    { featureKey: "enable_third_party_delivery", isRecommended: false },
    { featureKey: "enable_shift_management", isRecommended: false },
  ]
}
```

### 5. Bakery
```typescript
{
  typeKey: "bakery",
  name: "Bakery",
  displayName: "Bakery / Pastry Shop",
  description: "Bakery with fresh daily products",
  category: "FOOD_SERVICE",
  subcategory: "Bakery",

  hasDineIn: false,
  hasTakeaway: true,
  hasDelivery: false,
  hasKitchen: false,
  requiresTable: false,
  typicalOrderTime: 5,

  recommendedPlan: "BASIC",
  expectedDailyOrders: 100,

  features: [
    // CORE
    { featureKey: "enable_pos_interface", isRequired: true },
    { featureKey: "enable_quick_checkout", isRequired: true },
    { featureKey: "enable_order_history", isRequired: true },

    // HIGHLY RECOMMENDED
    { featureKey: "enable_inventory_tracking", isRecommended: true },  // Track daily stock
    { featureKey: "enable_low_stock_alerts", isRecommended: true },
    { featureKey: "enable_batch_expiry", isRecommended: true },  // Fresh daily
    { featureKey: "enable_waste_tracking", isRecommended: true },  // End-of-day waste

    // RECOMMENDED
    { featureKey: "enable_customer_database", isRecommended: false },
    { featureKey: "enable_loyalty_program", isRecommended: false },
    { featureKey: "enable_order_notes", isRecommended: false },
    { featureKey: "enable_manual_discounts", isRecommended: false },
    { featureKey: "enable_basic_reports", isRecommended: true },

    // OPTIONAL
    { featureKey: "enable_recipe_management", isRecommended: false },
    { featureKey: "enable_user_management", isRecommended: true },
  ]
}
```

### 6. Bar / Pub
```typescript
{
  typeKey: "bar_pub",
  name: "Bar / Pub",
  displayName: "Bar or Pub",
  description: "Bar with drinks and light food",
  category: "HOSPITALITY",
  subcategory: "Bar",

  hasDineIn: true,
  hasTakeaway: false,
  hasDelivery: false,
  hasKitchen: false,
  requiresTable: true,
  typicalOrderTime: 5,

  recommendedPlan: "PRO",
  expectedDailyOrders: 200,

  features: [
    // CORE
    { featureKey: "enable_pos_interface", isRequired: true },
    { featureKey: "enable_order_history", isRequired: true },
    { featureKey: "enable_table_management", isRequired: true },

    // HIGHLY RECOMMENDED
    { featureKey: "enable_quick_checkout", isRecommended: true },  // Fast bar service
    { featureKey: "enable_inventory_tracking", isRecommended: true },  // Track drinks
    { featureKey: "enable_low_stock_alerts", isRecommended: true },
    { featureKey: "enable_tipping", isRecommended: true },
    { featureKey: "enable_split_payments", isRecommended: true },  // Groups split tabs
    { featureKey: "enable_user_management", isRecommended: true },

    // RECOMMENDED
    { featureKey: "enable_happy_hour", isRecommended: false },  // Time-based pricing
    { featureKey: "enable_order_modifiers", isRecommended: false },  // Drink customization
    { featureKey: "enable_manual_discounts", isRecommended: false },
    { featureKey: "enable_shift_management", isRecommended: false },
    { featureKey: "enable_time_clock", isRecommended: false },

    // OPTIONAL
    { featureKey: "enable_customer_database", isRecommended: false },
    { featureKey: "enable_kitchen_display", isRecommended: false },  // If food served
  ]
}
```

### 7. Retail Store
```typescript
{
  typeKey: "retail_store",
  name: "Retail Store",
  displayName: "Retail / Convenience Store",
  description: "General retail with product variants",
  category: "RETAIL",
  subcategory: "General",

  hasDineIn: false,
  hasTakeaway: false,
  hasDelivery: false,
  hasKitchen: false,
  requiresTable: false,
  typicalOrderTime: 5,

  recommendedPlan: "PRO",
  expectedDailyOrders: 150,

  features: [
    // CORE
    { featureKey: "enable_pos_interface", isRequired: true },
    { featureKey: "enable_barcode_scanning", isRequired: true },  // Essential for retail
    { featureKey: "enable_order_history", isRequired: true },

    // HIGHLY RECOMMENDED
    { featureKey: "enable_inventory_tracking", isRecommended: true },
    { featureKey: "enable_low_stock_alerts", isRecommended: true },
    { featureKey: "enable_supplier_management", isRecommended: true },
    { featureKey: "enable_purchase_orders", isRecommended: true },
    { featureKey: "enable_user_management", isRecommended: true },

    // RECOMMENDED
    { featureKey: "enable_customer_database", isRecommended: false },
    { featureKey: "enable_loyalty_program", isRecommended: false },
    { featureKey: "enable_manual_discounts", isRecommended: false },
    { featureKey: "enable_coupon_codes", isRecommended: false },
    { featureKey: "enable_gift_cards", isRecommended: false },
    { featureKey: "enable_shift_management", isRecommended: false },
    { featureKey: "enable_basic_reports", isRecommended: true },

    // OPTIONAL
    { featureKey: "enable_batch_expiry", isRecommended: false },
    { featureKey: "enable_advanced_analytics", isRecommended: false },
  ]
}
```

### 8. Food Truck
```typescript
{
  typeKey: "food_truck",
  name: "Food Truck",
  displayName: "Food Truck / Mobile Food",
  description: "Mobile food service",
  category: "FOOD_SERVICE",
  subcategory: "Mobile",

  hasDineIn: false,
  hasTakeaway: true,
  hasDelivery: false,
  hasKitchen: true,
  requiresTable: false,
  typicalOrderTime: 10,

  recommendedPlan: "BASIC",
  expectedDailyOrders: 80,

  features: [
    // CORE
    { featureKey: "enable_pos_interface", isRequired: true },
    { featureKey: "enable_quick_checkout", isRequired: true },  // Speed is critical
    { featureKey: "enable_order_history", isRequired: true },

    // HIGHLY RECOMMENDED
    { featureKey: "enable_kitchen_display", isRecommended: true },
    { featureKey: "enable_order_modifiers", isRecommended: true },
    { featureKey: "enable_order_notes", isRecommended: true },
    { featureKey: "enable_inventory_tracking", isRecommended: true },  // Limited stock
    { featureKey: "enable_cash_payments", isRecommended: true },
    { featureKey: "enable_card_payments", isRecommended: true },
    { featureKey: "enable_digital_wallet", isRecommended: true },

    // RECOMMENDED
    { featureKey: "enable_customer_database", isRecommended: false },
    { featureKey: "enable_loyalty_program", isRecommended: false },
    { featureKey: "enable_manual_discounts", isRecommended: false },
    { featureKey: "enable_user_management", isRecommended: true },

    // OPTIONAL
    { featureKey: "enable_shift_management", isRecommended: false },
  ]
}
```

### 9. Multi-Location Restaurant Chain
```typescript
{
  typeKey: "restaurant_chain",
  name: "Multi-Location Restaurant Chain",
  displayName: "Restaurant Chain (Multiple Locations)",
  description: "Restaurant with 3+ locations requiring centralized management",
  category: "FOOD_SERVICE",
  subcategory: "Chain",

  hasDineIn: true,
  hasTakeaway: true,
  hasDelivery: true,
  hasKitchen: true,
  requiresTable: true,
  typicalOrderTime: 20,

  recommendedPlan: "ENTERPRISE",
  expectedDailyOrders: 500,

  features: [
    // CORE
    { featureKey: "enable_pos_interface", isRequired: true },
    { featureKey: "enable_order_history", isRequired: true },
    { featureKey: "enable_multi_location", isRequired: true },  // Essential!

    // HIGHLY RECOMMENDED (Everything)
    { featureKey: "enable_table_management", isRecommended: true },
    { featureKey: "enable_kitchen_display", isRecommended: true },
    { featureKey: "enable_order_modifiers", isRecommended: true },
    { featureKey: "enable_inventory_tracking", isRecommended: true },
    { featureKey: "enable_location_transfers", isRecommended: true },
    { featureKey: "enable_consolidated_reports", isRecommended: true },
    { featureKey: "enable_centralized_menu", isRecommended: true },
    { featureKey: "enable_supplier_management", isRecommended: true },
    { featureKey: "enable_purchase_orders", isRecommended: true },
    { featureKey: "enable_customer_database", isRecommended: true },
    { featureKey: "enable_loyalty_program", isRecommended: true },
    { featureKey: "enable_user_management", isRecommended: true },
    { featureKey: "enable_staff_scheduling", isRecommended: true },
    { featureKey: "enable_time_clock", isRecommended: true },
    { featureKey: "enable_shift_management", isRecommended: true },
    { featureKey: "enable_performance_tracking", isRecommended: true },
    { featureKey: "enable_advanced_analytics", isRecommended: true },
    { featureKey: "enable_sales_forecasting", isRecommended: true },
    { featureKey: "enable_inventory_forecasting", isRecommended: true },
    { featureKey: "enable_menu_engineering", isRecommended: true },

    // All other features available
  ]
}
```

---

## Super Admin Interface

### Admin Dashboard - Business Type Management

```typescript
// /super-admin/business-types

export function BusinessTypeManagementPage() {
  return (
    <div>
      <h1>Business Type Templates</h1>

      {/* List of templates */}
      <DataTable columns={[
        { header: "Template", accessor: "displayName" },
        { header: "Category", accessor: "category" },
        { header: "Features", accessor: "featureCount" },
        { header: "Tenants Using", accessor: "tenantCount" },
        { header: "Status", accessor: "isActive" },
      ]} />

      <Button onClick={createNewTemplate}>
        + Create New Business Type
      </Button>
    </div>
  )
}

// Create/Edit Template
export function BusinessTypeEditor({ templateId }: { templateId?: string }) {
  return (
    <Form>
      {/* Basic Info */}
      <Section title="Basic Information">
        <Input name="typeKey" label="Unique Key" />
        <Input name="name" label="Name" />
        <Input name="displayName" label="Display Name" />
        <Textarea name="description" label="Description" />
        <Select name="category" label="Category" />
        <Input name="subcategory" label="Subcategory" />
      </Section>

      {/* Characteristics */}
      <Section title="Business Characteristics">
        <Toggle name="hasDineIn" label="Has Dine-In Service" />
        <Toggle name="hasTakeaway" label="Has Takeaway" />
        <Toggle name="hasDelivery" label="Has Delivery" />
        <Toggle name="hasKitchen" label="Has Kitchen" />
        <Toggle name="requiresTable" label="Requires Table Management" />
        <Input name="typicalOrderTime" label="Typical Order Time (min)" type="number" />
      </Section>

      {/* Feature Selection */}
      <Section title="Feature Configuration">
        {/* Group by category */}
        <FeatureCategoryAccordion category="CORE_POS">
          {features.filter(f => f.category === 'CORE_POS').map(feature => (
            <FeatureRow key={feature.id}>
              <Toggle name={`feature_${feature.id}`} />
              <span>{feature.name}</span>
              <Select name={`requirement_${feature.id}`} options={[
                { value: 'required', label: 'Required' },
                { value: 'recommended', label: 'Recommended' },
                { value: 'optional', label: 'Optional' },
              ]} />
            </FeatureRow>
          ))}
        </FeatureCategoryAccordion>

        {/* Repeat for each category */}
      </Section>

      {/* Recommendations */}
      <Section title="Recommendations">
        <Select name="recommendedPlan" label="Recommended Subscription Plan" />
        <Input name="expectedDailyOrders" label="Expected Daily Orders" type="number" />
      </Section>

      <Button type="submit">Save Template</Button>
    </Form>
  )
}
```

---

## Tenant Onboarding Flow

### Step 1: Business Type Selection

```typescript
export function OnboardingStep1() {
  const [templates, setTemplates] = useState<BusinessTypeTemplate[]>([])

  // Fetch active templates
  useEffect(() => {
    fetch('/api/business-types').then(r => r.json()).then(setTemplates)
  }, [])

  // Group by category
  const groupedTemplates = groupBy(templates, 'category')

  return (
    <div>
      <h1>What type of business do you run?</h1>
      <p>Choose the option that best describes your business</p>

      {Object.entries(groupedTemplates).map(([category, templates]) => (
        <div key={category}>
          <h2>{category}</h2>
          <Grid>
            {templates.map(template => (
              <BusinessTypeCard
                key={template.id}
                template={template}
                onClick={() => selectTemplate(template)}
              />
            ))}
          </Grid>
        </div>
      ))}

      {/* Popular templates at top */}
      <Section title="Popular Choices">
        {templates.filter(t => t.isPopular).map(template => (
          <BusinessTypeCard key={template.id} template={template} />
        ))}
      </Section>
    </div>
  )
}

function BusinessTypeCard({ template, onClick }) {
  return (
    <Card onClick={onClick} className="cursor-pointer hover:shadow-lg">
      <Icon name={template.icon} size={48} />
      <h3>{template.displayName}</h3>
      <p>{template.description}</p>
      <Badge>{template.category}</Badge>
      {template.isPopular && <Badge variant="gold">Popular</Badge>}
    </Card>
  )
}
```

### Step 2: Confirm Features

```typescript
export function OnboardingStep2({ selectedTemplate }: { selectedTemplate: BusinessTypeTemplate }) {
  const [features, setFeatures] = useState<TemplateFeature[]>([])

  return (
    <div>
      <h1>Recommended Features for {selectedTemplate.displayName}</h1>
      <p>We've pre-selected the best features for your business type. You can customize these anytime in settings.</p>

      {/* Required features */}
      <Section title="✓ Core Features (Required)">
        {features.filter(f => f.isRequired).map(feature => (
          <FeatureItem key={feature.id} feature={feature} locked />
        ))}
      </Section>

      {/* Recommended features */}
      <Section title="⭐ Recommended Features">
        {features.filter(f => f.isRecommended && !f.isRequired).map(feature => (
          <FeatureItem
            key={feature.id}
            feature={feature}
            canToggle
            defaultEnabled
          />
        ))}
      </Section>

      {/* Optional features */}
      <Accordion title="Optional Features (Advanced)">
        {features.filter(f => !f.isRecommended && !f.isRequired).map(feature => (
          <FeatureItem
            key={feature.id}
            feature={feature}
            canToggle
            defaultEnabled={false}
          />
        ))}
      </Accordion>

      {/* Subscription note */}
      {hasLockedFeatures && (
        <Alert>
          Some features require a higher subscription plan.
          Current plan: <strong>{currentPlan}</strong>
          <Button variant="link">View Plans</Button>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button variant="outline" onClick={goBack}>Back</Button>
        <Button onClick={confirmAndCreate}>Continue</Button>
      </div>
    </div>
  )
}
```

### Step 3: Final Setup

```typescript
export function OnboardingStep3() {
  return (
    <div>
      <h1>Almost there!</h1>

      {/* Basic business info */}
      <Form>
        <Input name="businessName" label="Business Name" />
        <Input name="phone" label="Phone" />
        <Input name="address" label="Address" />

        {/* Create first user */}
        <Input name="yourName" label="Your Name" />
        <Input name="email" label="Email" />
        <Input name="password" label="Password" type="password" />

        <Button type="submit">Create My Business</Button>
      </Form>
    </div>
  )
}
```

---

## Tenant Settings - Feature Management

```typescript
// /settings/features

export function FeatureManagementPage() {
  const { data: tenant } = useTenant()
  const { data: enabledFeatures } = useEnabledFeatures()
  const { data: allFeatures } = useFeatureCatalog()

  // Group by category
  const grouped = groupBy(allFeatures, 'category')

  return (
    <div>
      <h1>Feature Management</h1>

      {/* Business template info */}
      <Card>
        <div className="flex justify-between">
          <div>
            <h3>Business Type</h3>
            <p>{tenant.businessTemplate.displayName}</p>
            <p className="text-sm text-gray-500">{tenant.businessTemplate.description}</p>
          </div>
          <Button variant="outline" onClick={changeBusinessType}>
            Change Business Type
          </Button>
        </div>
      </Card>

      {/* Feature categories */}
      {Object.entries(grouped).map(([category, features]) => (
        <Accordion key={category} title={category} defaultOpen={category === 'CORE_POS'}>
          {features.map(feature => (
            <FeatureToggleRow
              key={feature.id}
              feature={feature}
              isEnabled={isFeatureEnabled(feature.id, enabledFeatures)}
              onToggle={(enabled) => toggleFeature(feature.id, enabled)}
            />
          ))}
        </Accordion>
      ))}

      {/* Reset to defaults */}
      <Alert>
        <AlertTitle>Reset to Template Defaults</AlertTitle>
        <AlertDescription>
          Restore the recommended feature configuration for {tenant.businessTemplate.displayName}.
          This will not affect your data.
        </AlertDescription>
        <Button variant="outline" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
      </Alert>
    </div>
  )
}

function FeatureToggleRow({ feature, isEnabled, onToggle }) {
  const canEnable = checkSubscriptionAccess(feature.minimumPlan)
  const hasUnmetDependencies = checkDependencies(feature.dependsOn)

  return (
    <div className="flex items-center justify-between py-4 border-b">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4>{feature.name}</h4>
          {feature.isBeta && <Badge variant="blue">Beta</Badge>}
          {feature.isCore && <Badge variant="gray">Core</Badge>}
        </div>
        <p className="text-sm text-gray-600">{feature.description}</p>

        {/* Dependencies */}
        {feature.dependsOn && feature.dependsOn.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Requires: {feature.dependsOn.map(d => d.name).join(', ')}
          </p>
        )}

        {/* Subscription requirement */}
        {!canEnable && (
          <Badge variant="gold">
            Requires {feature.minimumPlan} plan
            <Button variant="link" size="sm">Upgrade</Button>
          </Badge>
        )}
      </div>

      <Toggle
        checked={isEnabled}
        onCheckedChange={onToggle}
        disabled={!canEnable || hasUnmetDependencies}
      />
    </div>
  )
}
```

---

## API Design

### Endpoints

```typescript
// Get all business type templates
GET /api/business-types
Response: BusinessTypeTemplate[]

// Get single template with features
GET /api/business-types/:id
Response: BusinessTypeTemplate & { features: TemplateFeature[] }

// Get feature catalog
GET /api/features
Response: Feature[]

// Get tenant's enabled features
GET /api/tenant/features
Response: { [featureKey: string]: boolean }

// Toggle feature for tenant
POST /api/tenant/features/:featureKey/toggle
Body: { enabled: boolean }
Response: { success: boolean }

// Reset to template defaults
POST /api/tenant/features/reset-to-defaults
Response: { success: boolean, features: TenantFeature[] }

// Check if feature is enabled
GET /api/tenant/features/:featureKey/check
Response: { enabled: boolean, reason?: string }

// Super Admin: Create/update business type template
POST /api/super-admin/business-types
PUT /api/super-admin/business-types/:id
Body: BusinessTypeTemplate & { features: TemplateFeature[] }
Response: BusinessTypeTemplate

// Super Admin: Create/update feature
POST /api/super-admin/features
PUT /api/super-admin/features/:id
Body: Feature
Response: Feature
```

### Helper Functions

```typescript
// lib/features.ts

export async function isFeatureEnabled(
  tenantId: string,
  featureKey: string
): Promise<boolean> {
  // Check tenant_features table
  const tenantFeature = await prisma.tenant_features.findUnique({
    where: {
      tenantId_featureId: {
        tenantId,
        featureId: getFeatureId(featureKey)
      }
    }
  })

  return tenantFeature?.isEnabled ?? false
}

export async function checkFeatureAccess(
  tenantId: string,
  featureKey: string
): Promise<{ allowed: boolean, reason?: string }> {
  // Check subscription plan
  const tenant = await prisma.tenants.findUnique({
    where: { id: tenantId },
    include: { subscriptions: true }
  })

  const feature = await prisma.feature_catalog.findUnique({
    where: { featureKey }
  })

  if (!feature) {
    return { allowed: false, reason: 'Feature not found' }
  }

  // Check plan requirement
  if (feature.minimumPlan && tenant.subscriptions.plan < feature.minimumPlan) {
    return {
      allowed: false,
      reason: `Requires ${feature.minimumPlan} plan`
    }
  }

  // Check dependencies
  if (feature.dependsOn && feature.dependsOn.length > 0) {
    for (const depKey of feature.dependsOn) {
      const depEnabled = await isFeatureEnabled(tenantId, depKey)
      if (!depEnabled) {
        return {
          allowed: false,
          reason: `Requires ${depKey} to be enabled first`
        }
      }
    }
  }

  return { allowed: true }
}

// React hook
export function useFeature(featureKey: string): boolean {
  const { data } = useSWR(`/api/tenant/features/${featureKey}/check`)
  return data?.enabled ?? false
}

// React component
export function FeatureGate({
  feature,
  fallback = null,
  children
}: {
  feature: string
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  const enabled = useFeature(feature)

  if (!enabled) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
```

---

## Migration Strategy

### Phase 1: Database Setup
```bash
# Add new tables
prisma migrate dev --name add_feature_system

# Seed feature catalog
npm run seed:features

# Seed business type templates
npm run seed:business-types
```

### Phase 2: Migrate Existing Tenants
```typescript
// scripts/migrate-existing-tenants.ts

async function migrateExistingTenants() {
  const tenants = await prisma.tenants.findMany({
    include: { tenant_settings: true }
  })

  for (const tenant of tenants) {
    // Map old businessType to new template
    const template = await findTemplateForOldBusinessType(tenant.businessType)

    // Update tenant
    await prisma.tenants.update({
      where: { id: tenant.id },
      data: { businessTemplateId: template.id }
    })

    // Create tenant features from template defaults
    const templateFeatures = await prisma.template_features.findMany({
      where: { templateId: template.id }
    })

    for (const tf of templateFeatures) {
      await prisma.tenant_features.create({
        data: {
          tenantId: tenant.id,
          featureId: tf.featureId,
          isEnabled: tf.isEnabledByDefault
        }
      })
    }

    // Migrate old feature flags from tenant_settings
    await migrateTenantSettings(tenant.id, tenant.tenant_settings)
  }
}
```

---

## Summary

### This System Provides:

1. ✅ **Backend-Driven**: All business types in database
2. ✅ **Intelligent Defaults**: Smart features per business type
3. ✅ **Owner Customization**: Toggle features in settings
4. ✅ **Scalable**: Super admin adds new types without code
5. ✅ **Dependency-Aware**: Features can depend on others
6. ✅ **Subscription-Gated**: Features tied to plans
7. ✅ **Flexible**: Works for any business type
8. ✅ **Extensible**: Easy to add new features

### Next Steps:

1. Add database schema to Prisma
2. Create seed scripts for features and templates
3. Build super admin interface
4. Build tenant onboarding flow
5. Build tenant feature management
6. Create API endpoints
7. Add feature gates to UI
8. Migrate existing tenants
9. Test thoroughly

Would you like me to:
1. **Implement the Prisma schema** with migrations?
2. **Create the seed scripts** for features and templates?
3. **Build the super admin interface**?
4. **Build the onboarding flow**?
5. **Create the tenant settings page**?
