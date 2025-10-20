# Adaptive Feature System Design

## Problem Statement
Different businesses need different features:
- **Takeaway Shop**: Simple ordering, no tables, no reservations, basic inventory
- **Full Restaurant**: Tables, reservations, kitchen display, course timing, waitlist
- **Multi-location Chain**: All above + location management, consolidated reporting, transfers
- **Coffee Shop**: Fast checkout, modifiers (sizes, milk types), loyalty, no tables
- **Retail Store**: Barcode scanning, detailed inventory, suppliers, no kitchen

## Solution: Adaptive Feature Flags + Business Profiles

---

## 1. Enhanced Database Schema

### A. Business Profile Model (NEW)
```prisma
model business_profiles {
  id                    String       @id
  tenantId              String       @unique
  businessType          BusinessType @default(RETAIL)

  // Business size & complexity
  operationalModel      OperationalModel @default(SINGLE_LOCATION)
  expectedMonthlyOrders Int          @default(1000)
  employeeCount         Int          @default(5)
  locationCount         Int          @default(1)

  // Service model
  hasDineIn             Boolean      @default(false)
  hasTakeaway           Boolean      @default(true)
  hasDelivery           Boolean      @default(false)
  hasOnlineOrdering     Boolean      @default(false)

  // Setup questionnaire responses
  setupCompleted        Boolean      @default(false)
  setupAnswers          Json?

  createdAt             DateTime     @default(now())
  updatedAt             DateTime

  tenants               tenants      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}

enum OperationalModel {
  SINGLE_LOCATION       // Single shop
  MULTI_LOCATION        // 2-5 locations
  CHAIN                 // 6+ locations
  FRANCHISE             // Franchise management needed
}
```

### B. Feature Flags Model (NEW)
```prisma
model feature_flags {
  id                      String    @id
  tenantId                String    @unique

  // Core POS Features (always enabled)
  enablePOS               Boolean   @default(true)
  enableProducts          Boolean   @default(true)
  enableOrders            Boolean   @default(true)

  // Inventory Management
  enableInventoryTracking Boolean   @default(true)
  enableStockAlerts       Boolean   @default(true)
  enableSuppliers         Boolean   @default(false)
  enablePurchaseOrders    Boolean   @default(false)
  enableRecipeManagement  Boolean   @default(false)  // Track ingredients
  enableWasteTracking     Boolean   @default(false)
  enableBarcodeScanning   Boolean   @default(false)

  // Customer Features
  enableCustomerDatabase  Boolean   @default(false)
  enableLoyaltyProgram    Boolean   @default(false)
  enableCustomerAnalytics Boolean   @default(false)
  enableEmailMarketing    Boolean   @default(false)
  enableSMSMarketing      Boolean   @default(false)
  enableGiftCards         Boolean   @default(false)

  // Table Management
  enableTableManagement   Boolean   @default(false)
  enableReservations      Boolean   @default(false)
  enableWaitlist          Boolean   @default(false)
  enableFloorPlan         Boolean   @default(false)

  // Kitchen Operations
  enableKitchenDisplay    Boolean   @default(false)
  enableCourseManagement  Boolean   @default(false)  // Fire apps, hold entrees
  enablePrepStations      Boolean   @default(false)  // Route to grill/fry/salad
  enableRecipeCards       Boolean   @default(false)

  // Order Types
  enableDineIn            Boolean   @default(true)
  enableTakeaway          Boolean   @default(true)
  enableDelivery          Boolean   @default(false)
  enableOnlineOrdering    Boolean   @default(false)
  enableQROrdering        Boolean   @default(false)

  // Payments & Discounts
  enableDiscounts         Boolean   @default(true)
  enableCoupons           Boolean   @default(false)
  enableTipping           Boolean   @default(false)
  enableSplitBills        Boolean   @default(false)
  enableGratuity          Boolean   @default(false)  // Auto-gratuity for groups

  // Staff Management
  enableTimeClock         Boolean   @default(false)
  enableShiftManagement   Boolean   @default(false)
  enableStaffScheduling   Boolean   @default(false)
  enablePerformanceMetrics Boolean  @default(false)
  enableTipPooling        Boolean   @default(false)

  // Multi-location
  enableMultiLocation     Boolean   @default(false)
  enableLocationTransfers Boolean   @default(false)
  enableConsolidatedReports Boolean @default(false)

  // Advanced Features
  enableModifiers         Boolean   @default(true)
  enableVariants          Boolean   @default(false)  // Sizes, colors
  enableBundles           Boolean   @default(false)  // Combo meals
  enableSubscriptions     Boolean   @default(false)  // Recurring orders
  enablePreOrders         Boolean   @default(false)  // Schedule future orders

  // Reporting & Analytics
  enableAdvancedReports   Boolean   @default(false)
  enableInventoryForecasting Boolean @default(false)
  enableSalesForecasting  Boolean   @default(false)
  enableABCAnalysis       Boolean   @default(false)
  enableMenuEngineering   Boolean   @default(false)

  // Hardware
  enableThermalPrinter    Boolean   @default(true)
  enableCashDrawer        Boolean   @default(true)
  enableKitchenPrinter    Boolean   @default(false)
  enableCustomerDisplay   Boolean   @default(false)
  enableScale             Boolean   @default(false)

  // Compliance & Security
  enableAuditLogs         Boolean   @default(true)
  enableVoidApproval      Boolean   @default(true)
  enableRefundApproval    Boolean   @default(true)
  enableManagerOverrides  Boolean   @default(true)

  createdAt               DateTime  @default(now())
  updatedAt               DateTime

  tenants                 tenants   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}
```

### C. Update Existing Models

#### Add to `tenants` table:
```prisma
model tenants {
  // ... existing fields ...
  business_profiles business_profiles?
  feature_flags     feature_flags?
}
```

#### Expand `BusinessType` enum:
```prisma
enum BusinessType {
  RETAIL
  RESTAURANT
  COFFEE_SHOP
  TAKEAWAY
  BAKERY
  BAR
  FOOD_TRUCK
  MIXED
  QUICK_SERVICE      // Fast food
  CASUAL_DINING      // Full service restaurant
  FINE_DINING        // High-end restaurant
  GROCERY
  CONVENIENCE_STORE
}
```

---

## 2. Business Profile Presets

### Preset Configurations by Business Type

#### A. **Takeaway Shop** (Simple)
```typescript
const TAKEAWAY_PRESET = {
  businessType: 'TAKEAWAY',
  operationalModel: 'SINGLE_LOCATION',

  // Service model
  hasDineIn: false,
  hasTakeaway: true,
  hasDelivery: true,
  hasOnlineOrdering: true,

  // Feature flags
  enablePOS: true,
  enableProducts: true,
  enableOrders: true,
  enableInventoryTracking: true,
  enableStockAlerts: true,
  enableModifiers: true,
  enableDiscounts: true,
  enableCustomerDatabase: true,
  enableLoyaltyProgram: true,
  enableThermalPrinter: true,
  enableCashDrawer: true,

  // Disabled features
  enableTableManagement: false,
  enableReservations: false,
  enableKitchenDisplay: false,
  enableCourseManagement: false,
  enableWaitlist: false,
  enableTipping: false,
  enableSplitBills: false,
  enableShiftManagement: false,
  enableMultiLocation: false,
}
```

#### B. **Full-Service Restaurant** (Complex)
```typescript
const RESTAURANT_PRESET = {
  businessType: 'CASUAL_DINING',
  operationalModel: 'SINGLE_LOCATION',

  // Service model
  hasDineIn: true,
  hasTakeaway: true,
  hasDelivery: false,
  hasOnlineOrdering: false,

  // Feature flags - EVERYTHING enabled
  enablePOS: true,
  enableProducts: true,
  enableOrders: true,
  enableInventoryTracking: true,
  enableStockAlerts: true,
  enableModifiers: true,
  enableDiscounts: true,
  enableCoupons: true,

  // Customer features
  enableCustomerDatabase: true,
  enableLoyaltyProgram: true,
  enableCustomerAnalytics: true,

  // Table features
  enableTableManagement: true,
  enableReservations: true,
  enableWaitlist: true,
  enableFloorPlan: true,

  // Kitchen features
  enableKitchenDisplay: true,
  enableCourseManagement: true,
  enablePrepStations: true,
  enableKitchenPrinter: true,

  // Payment features
  enableTipping: true,
  enableSplitBills: true,
  enableGratuity: true,

  // Staff features
  enableTimeClock: true,
  enableShiftManagement: true,
  enablePerformanceMetrics: true,
  enableTipPooling: true,

  // Hardware
  enableThermalPrinter: true,
  enableCashDrawer: true,
  enableCustomerDisplay: true,
}
```

#### C. **Coffee Shop** (Fast Service)
```typescript
const COFFEE_SHOP_PRESET = {
  businessType: 'COFFEE_SHOP',
  operationalModel: 'SINGLE_LOCATION',

  // Service model
  hasDineIn: true,
  hasTakeaway: true,
  hasDelivery: false,
  hasOnlineOrdering: true,

  // Feature flags
  enablePOS: true,
  enableProducts: true,
  enableOrders: true,
  enableModifiers: true,  // CRITICAL: Size, milk type, etc.
  enableVariants: true,   // Small/Med/Large
  enableInventoryTracking: true,
  enableStockAlerts: true,

  // Customer loyalty is HUGE for coffee
  enableCustomerDatabase: true,
  enableLoyaltyProgram: true,
  enableCustomerAnalytics: true,

  // Discounts & marketing
  enableDiscounts: true,
  enableCoupons: true,
  enableEmailMarketing: true,

  // NO table management (most are grab-and-go)
  enableTableManagement: false,
  enableReservations: false,
  enableWaitlist: false,

  // Simple kitchen
  enableKitchenDisplay: true,
  enableCourseManagement: false,
  enablePrepStations: false,

  // No tipping usually
  enableTipping: false,
  enableSplitBills: true,  // Groups splitting coffee orders

  // Staff features
  enableTimeClock: true,
  enableShiftManagement: true,
}
```

#### D. **Multi-Location Chain** (Enterprise)
```typescript
const CHAIN_PRESET = {
  businessType: 'QUICK_SERVICE',
  operationalModel: 'CHAIN',
  locationCount: 10,

  // Service model
  hasDineIn: true,
  hasTakeaway: true,
  hasDelivery: true,
  hasOnlineOrdering: true,

  // ALL features enabled
  enableMultiLocation: true,
  enableLocationTransfers: true,
  enableConsolidatedReports: true,

  // Advanced inventory
  enableInventoryTracking: true,
  enableStockAlerts: true,
  enableSuppliers: true,
  enablePurchaseOrders: true,
  enableRecipeManagement: true,
  enableWasteTracking: true,
  enableInventoryForecasting: true,

  // Advanced analytics
  enableAdvancedReports: true,
  enableSalesForecasting: true,
  enableABCAnalysis: true,
  enableMenuEngineering: true,

  // Staff management
  enableTimeClock: true,
  enableShiftManagement: true,
  enableStaffScheduling: true,
  enablePerformanceMetrics: true,

  // Everything else
  enableKitchenDisplay: true,
  enableCustomerAnalytics: true,
  enableLoyaltyProgram: true,
  enableDiscounts: true,
  enableCoupons: true,
  enableModifiers: true,
  enableBundles: true,
}
```

#### E. **Retail Store** (Inventory Focus)
```typescript
const RETAIL_PRESET = {
  businessType: 'RETAIL',
  operationalModel: 'SINGLE_LOCATION',

  // No food service
  hasDineIn: false,
  hasTakeaway: false,
  hasDelivery: true,
  hasOnlineOrdering: true,

  // Heavy inventory features
  enableInventoryTracking: true,
  enableStockAlerts: true,
  enableSuppliers: true,
  enablePurchaseOrders: true,
  enableBarcodeScanning: true,  // CRITICAL for retail
  enableVariants: true,  // Sizes, colors
  enableBundles: true,   // Product bundles

  // Customer features
  enableCustomerDatabase: true,
  enableLoyaltyProgram: true,
  enableGiftCards: true,
  enableEmailMarketing: true,

  // NO restaurant features
  enableTableManagement: false,
  enableReservations: false,
  enableKitchenDisplay: false,
  enableCourseManagement: false,
  enableTipping: false,
  enableSplitBills: false,

  // Basic staff
  enableTimeClock: true,
  enableShiftManagement: true,

  // Hardware
  enableBarcodeScanning: true,
  enableScale: true,  // For weighted items
}
```

---

## 3. Smart Onboarding Flow

### Step 1: Business Type Selection
```
┌─────────────────────────────────────────┐
│  What type of business do you run?     │
├─────────────────────────────────────────┤
│  🍕 Full-Service Restaurant             │
│  🌮 Takeaway/Quick Service              │
│  ☕ Coffee Shop/Cafe                    │
│  🏪 Retail Store                        │
│  🍞 Bakery                              │
│  🍺 Bar/Pub                             │
│  🚚 Food Truck                          │
└─────────────────────────────────────────┘
```

### Step 2: Service Model
```
┌─────────────────────────────────────────┐
│  What services do you offer?           │
├─────────────────────────────────────────┤
│  ☑ Dine-in (with tables)               │
│  ☑ Takeaway/To-go                      │
│  ☐ Delivery (own drivers)              │
│  ☐ Online ordering                     │
│  ☐ Reservations                        │
└─────────────────────────────────────────┘
```

### Step 3: Business Size
```
┌─────────────────────────────────────────┐
│  How many locations do you have?       │
├─────────────────────────────────────────┤
│  ⦿ Single location                     │
│  ○ 2-5 locations                       │
│  ○ 6+ locations (chain)                │
│  ○ Franchise model                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  How many employees?                    │
├─────────────────────────────────────────┤
│  ⦿ 1-5 (small team)                    │
│  ○ 6-20 (medium team)                  │
│  ○ 21+ (large team)                    │
└─────────────────────────────────────────┘
```

### Step 4: Feature Recommendations
```
┌──────────────────────────────────────────────┐
│  Based on your answers, we recommend:       │
├──────────────────────────────────────────────┤
│  ✓ Point of Sale                            │
│  ✓ Inventory Tracking                       │
│  ✓ Customer Database                        │
│  ✓ Kitchen Display System                   │
│  ✓ Table Management                         │
│  ✓ Reservations                             │
│                                              │
│  Optional features you can enable later:    │
│  · Multi-location management                │
│  · Advanced analytics                       │
│  · Employee scheduling                      │
│                                              │
│  [ Customize Features ]  [ Continue ]       │
└──────────────────────────────────────────────┘
```

### Step 5: Feature Customization (Optional)
```
Categorized feature toggles with descriptions
```

---

## 4. Dynamic UI Rendering

### Navigation Menu (Adaptive)

#### Takeaway Shop Sees:
```
├─ 📊 Dashboard
├─ 🛒 POS
├─ 📦 Inventory
├─ 👥 Customers
├─ 📋 Orders
├─ 📈 Reports
└─ ⚙️  Settings
```

#### Full Restaurant Sees:
```
├─ 📊 Dashboard
├─ 🛒 POS
├─ 📦 Inventory
├─ 👥 Customers
├─ 📋 Orders
├─ 🍽️  Tables          ← NEW
├─ 📅 Reservations     ← NEW
├─ 👨‍🍳 Kitchen Display  ← NEW
├─ 👔 Staff            ← NEW
├─ 📈 Reports
└─ ⚙️  Settings
```

#### Multi-location Chain Sees:
```
├─ 📊 Dashboard
├─ 🏢 Locations        ← NEW
│   ├─ Location 1
│   ├─ Location 2
│   └─ Add Location
├─ 🛒 POS
├─ 📦 Inventory
│   ├─ Products
│   ├─ Suppliers       ← NEW
│   ├─ Purchase Orders ← NEW
│   └─ Transfers       ← NEW
├─ 👥 Customers
├─ 📋 Orders
├─ 🍽️  Tables
├─ 👨‍🍳 Kitchen
├─ 👔 Staff
│   ├─ Employees
│   ├─ Schedules       ← NEW
│   ├─ Time Clock      ← NEW
│   └─ Performance     ← NEW
├─ 📈 Reports
│   ├─ Sales
│   ├─ Inventory
│   ├─ Staff           ← NEW
│   └─ Consolidated    ← NEW
└─ ⚙️  Settings
```

### Code Implementation

```typescript
// lib/features.ts
import { FeatureFlags, BusinessProfile } from '@prisma/client'

export function getVisibleNavItems(
  featureFlags: FeatureFlags,
  businessProfile: BusinessProfile
) {
  const baseItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'BarChart' },
    { name: 'POS', href: '/pos', icon: 'ShoppingCart' },
    { name: 'Inventory', href: '/inventory', icon: 'Package' },
    { name: 'Customers', href: '/customers', icon: 'Users' },
    { name: 'Orders', href: '/orders', icon: 'ClipboardList' },
  ]

  const conditionalItems = []

  if (featureFlags.enableTableManagement) {
    conditionalItems.push({
      name: 'Tables',
      href: '/tables',
      icon: 'Grid3x3',
    })
  }

  if (featureFlags.enableReservations) {
    conditionalItems.push({
      name: 'Reservations',
      href: '/reservations',
      icon: 'Calendar',
    })
  }

  if (featureFlags.enableKitchenDisplay) {
    conditionalItems.push({
      name: 'Kitchen',
      href: '/kitchen',
      icon: 'ChefHat',
    })
  }

  if (
    featureFlags.enableTimeClock ||
    featureFlags.enableShiftManagement ||
    featureFlags.enableStaffScheduling
  ) {
    conditionalItems.push({
      name: 'Staff',
      href: '/staff',
      icon: 'Users',
    })
  }

  if (featureFlags.enableMultiLocation) {
    conditionalItems.push({
      name: 'Locations',
      href: '/locations',
      icon: 'Building',
    })
  }

  return [
    ...baseItems,
    ...conditionalItems,
    { name: 'Reports', href: '/reports', icon: 'TrendingUp' },
    { name: 'Settings', href: '/settings', icon: 'Settings' },
  ]
}

// Check if feature is enabled
export function useFeature(featureName: keyof FeatureFlags) {
  const { data: featureFlags } = useSWR('/api/feature-flags')
  return featureFlags?.[featureName] ?? false
}

// Example usage in component
export function POSPage() {
  const hasModifiers = useFeature('enableModifiers')
  const hasSplitBills = useFeature('enableSplitBills')
  const hasDiscounts = useFeature('enableDiscounts')

  return (
    <div>
      {/* Product grid */}

      {hasModifiers && <ModifierSelector />}

      <Cart>
        {hasDiscounts && <DiscountButton />}
        {hasSplitBills && <SplitBillButton />}
      </Cart>
    </div>
  )
}
```

---

## 5. Settings Page - Feature Management

```typescript
// Settings page with categorized features
export function FeatureManagementPage() {
  return (
    <div className="space-y-8">
      <h1>Feature Management</h1>

      {/* Business Profile */}
      <Card>
        <h2>Business Profile</h2>
        <Select name="businessType" />
        <Select name="operationalModel" />
        <Input name="locationCount" type="number" />
      </Card>

      {/* Features by category */}
      <Accordion>
        <AccordionItem title="Inventory Features">
          <Toggle name="enableInventoryTracking" />
          <Toggle name="enableStockAlerts" />
          <Toggle name="enableSuppliers" disabled={plan === 'BASIC'} />
          <Toggle name="enablePurchaseOrders" disabled={plan === 'BASIC'} />
          <Toggle name="enableRecipeManagement" disabled={plan === 'BASIC'} />
        </AccordionItem>

        <AccordionItem title="Customer Features">
          <Toggle name="enableCustomerDatabase" />
          <Toggle name="enableLoyaltyProgram" />
          <Toggle name="enableCustomerAnalytics" disabled={plan === 'BASIC'} />
          <Toggle name="enableEmailMarketing" disabled={plan !== 'ENTERPRISE'} />
        </AccordionItem>

        <AccordionItem title="Table & Reservations">
          <Toggle name="enableTableManagement" />
          <Toggle name="enableReservations" />
          <Toggle name="enableWaitlist" disabled={!featureFlags.enableReservations} />
        </AccordionItem>

        {/* ... more categories ... */}
      </Accordion>

      {/* Reset to preset */}
      <Button onClick={resetToPreset}>
        Reset to {businessProfile.businessType} Preset
      </Button>
    </div>
  )
}
```

---

## 6. Subscription Plans with Feature Gating

### Plan Tiers

| Feature | Basic | Pro | Enterprise |
|---------|-------|-----|------------|
| POS & Orders | ✓ | ✓ | ✓ |
| Inventory Tracking | ✓ | ✓ | ✓ |
| Customer Database | ✓ | ✓ | ✓ |
| Loyalty Program | ✓ | ✓ | ✓ |
| Table Management | ✓ | ✓ | ✓ |
| Kitchen Display | ✓ | ✓ | ✓ |
| Discounts & Coupons | ✓ | ✓ | ✓ |
| **Modifiers** | ✓ | ✓ | ✓ |
| **Split Bills** | ✓ | ✓ | ✓ |
| Reservations | - | ✓ | ✓ |
| Online Ordering | - | ✓ | ✓ |
| Staff Scheduling | - | ✓ | ✓ |
| Suppliers & POs | - | ✓ | ✓ |
| Recipe Management | - | ✓ | ✓ |
| Customer Analytics | - | ✓ | ✓ |
| Multi-location (2-5) | - | ✓ | ✓ |
| Email Marketing | - | - | ✓ |
| SMS Marketing | - | - | ✓ |
| Advanced Forecasting | - | - | ✓ |
| Multi-location (6+) | - | - | ✓ |
| Franchise Mode | - | - | ✓ |
| API Access | - | - | ✓ |
| White Label | - | - | ✓ |

### Pricing (Example)
- **Basic**: $49/month - Single location, up to 5 users
- **Pro**: $149/month - Up to 5 locations, up to 20 users
- **Enterprise**: $399/month - Unlimited locations, unlimited users

---

## 7. Migration Plan

### Phase 1: Schema Updates
1. Add `business_profiles` table
2. Add `feature_flags` table
3. Add `OperationalModel` enum
4. Expand `BusinessType` enum

### Phase 2: Data Migration
1. Create default business profile for existing tenants
2. Create feature flags from existing `tenant_settings`
3. Set defaults based on `tenant.businessType`

### Phase 3: Backend Implementation
1. Create feature flag API endpoints
2. Add middleware to check feature access
3. Create helper functions for feature checks

### Phase 4: Frontend Implementation
1. Update navigation to be dynamic
2. Add feature checks to all pages
3. Hide/show components based on flags
4. Create onboarding flow for new tenants
5. Create feature management settings page

### Phase 5: Testing & Rollout
1. Test each business type preset
2. Test feature toggling
3. Test subscription gating
4. Gradual rollout to existing customers

---

## 8. Code Examples

### API Route Protection
```typescript
// middleware/featureCheck.ts
export function requireFeature(featureName: keyof FeatureFlags) {
  return async (req, res, next) => {
    const { tenantId } = req.user
    const featureFlags = await prisma.feature_flags.findUnique({
      where: { tenantId }
    })

    if (!featureFlags[featureName]) {
      return res.status(403).json({
        error: 'Feature not enabled',
        feature: featureName,
        message: 'Please upgrade your plan or enable this feature in settings'
      })
    }

    next()
  }
}

// Usage
app.get('/api/reservations',
  requireAuth,
  requireFeature('enableReservations'),
  getReservations
)
```

### React Component Gating
```typescript
// components/FeatureGate.tsx
export function FeatureGate({
  feature,
  fallback = null,
  children
}: {
  feature: keyof FeatureFlags
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  const enabled = useFeature(feature)

  if (!enabled) {
    return fallback
  }

  return <>{children}</>
}

// Usage
<FeatureGate feature="enableReservations">
  <ReservationButton />
</FeatureGate>
```

---

## 9. Benefits

### For Customers
1. **Simple onboarding** - Only see what they need
2. **No clutter** - Clean UI without irrelevant features
3. **Guided setup** - Presets get them started fast
4. **Scalability** - Enable features as they grow
5. **Pay for what you use** - Only pay for needed features

### For Business (You)
1. **Market segmentation** - Different pricing tiers
2. **Upsell path** - Easy to upgrade customers
3. **Competitive edge** - "Perfect fit" for each business type
4. **Reduced support** - Less confusion about features
5. **Faster sales** - "Yes, we support your business type"

---

## 10. Quick Implementation Checklist

- [ ] Add new database models
- [ ] Create migration scripts
- [ ] Seed presets for each business type
- [ ] Create feature flag API
- [ ] Add feature check middleware
- [ ] Create `useFeature()` hook
- [ ] Create `<FeatureGate>` component
- [ ] Update navigation to be dynamic
- [ ] Create onboarding flow
- [ ] Add feature management to settings
- [ ] Update subscription plans
- [ ] Add upgrade prompts for locked features
- [ ] Test each preset thoroughly
- [ ] Create admin panel to override features
- [ ] Document feature dependencies (e.g., waitlist requires reservations)

---

This design gives you:
✅ **Flexibility** - Supports any business type
✅ **Simplicity** - Users only see what they need
✅ **Scalability** - Grow with customers
✅ **Revenue** - Upsell path built-in
✅ **Speed** - Presets = fast onboarding
