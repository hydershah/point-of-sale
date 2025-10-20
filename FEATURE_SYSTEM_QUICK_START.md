# 🚀 Feature System - Quick Start

## Run This First

```bash
# 1. Run migration
npx prisma migrate dev --name add_feature_system

# 2. Seed database (with demo data for testing)
SEED_DEMO_DATA=true SUPER_ADMIN_PASSWORD="password" npm run seed

# 3. Start dev server
npm run dev
```

## Test URLs

- **Onboarding**: http://localhost:3000/onboarding
- **Feature Settings**: http://localhost:3000/settings/features
- **Super Admin**: http://admin.localhost:3000/super-admin/business-types

**Demo Login:**
- Email: admin@demo.com
- Password: password

---

## Common Use Cases

### 1. Hide Feature in UI

```tsx
import { FeatureGate } from '@/components/feature-gate'

<FeatureGate feature="enable_table_management">
  <TablesLink />
</FeatureGate>
```

### 2. Check Feature in Component

```tsx
import { useFeature } from '@/hooks/use-features'

export function MyComponent() {
  const hasKitchen = useFeature('enable_kitchen_display')

  return <div>{hasKitchen ? <KDS /> : <SimpleView />}</div>
}
```

### 3. Protect API Route

```tsx
import { isFeatureEnabled } from '@/lib/features'

export async function GET(request) {
  const session = await getServerSession()

  const hasFeature = await isFeatureEnabled(
    session.user.tenantId,
    'enable_online_ordering'
  )

  if (!hasFeature) {
    return new Response('Feature not enabled', { status: 403 })
  }

  // Continue...
}
```

---

## Add New Business Type

**File:** `prisma/seeds/business-types.ts`

```typescript
{
  typeKey: 'my_business',
  name: 'My Business Type',
  displayName: 'My Business - Description',
  description: 'Perfect for...',
  category: 'FOOD_SERVICE',
  hasDineIn: true,
  hasTakeaway: true,
  icon: 'Store',
  recommendedPlan: 'BASIC',
  features: [
    { featureKey: 'enable_pos_interface', isRequired: true },
    { featureKey: 'enable_inventory_tracking', isRecommended: true },
    // Add more features...
  ],
}
```

Then run: `npm run seed`

---

## Add New Feature

**File:** `prisma/seeds/features.ts`

```typescript
{
  featureKey: 'enable_my_feature',
  name: 'My Feature',
  description: 'What it does',
  category: 'CORE_POS',
  minimumPlan: 'PRO',
  dependsOn: ['enable_other_feature'], // optional
  sortOrder: 100,
}
```

Then run: `npm run seed`

---

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema (4 new tables) |
| `prisma/seeds/features.ts` | 80+ feature definitions |
| `prisma/seeds/business-types.ts` | 9 business type templates |
| `src/lib/features.ts` | Helper functions |
| `src/hooks/use-features.ts` | React hooks |
| `src/components/feature-gate.tsx` | Feature gate component |
| `src/app/(tenant)/settings/features/page.tsx` | Feature settings page |
| `src/app/(tenant)/onboarding/page.tsx` | Business type selection |

---

## Available Features

### Core Features (Always On)
- `enable_pos_interface`
- `enable_order_history`
- `enable_cash_payments`
- `enable_card_payments`
- `enable_user_management`
- `enable_basic_reports`
- `enable_audit_logs`

### Popular Features
- `enable_inventory_tracking`
- `enable_low_stock_alerts`
- `enable_customer_database`
- `enable_loyalty_program`
- `enable_order_modifiers`
- `enable_table_management`
- `enable_kitchen_display`
- `enable_manual_discounts`
- `enable_split_payments`
- `enable_tipping`

### Premium Features (PRO+)
- `enable_table_reservations`
- `enable_online_ordering`
- `enable_delivery_management`
- `enable_supplier_management`
- `enable_purchase_orders`
- `enable_recipe_management`
- `enable_shift_management`
- `enable_multi_location`

### Enterprise Features
- `enable_email_marketing`
- `enable_sms_marketing`
- `enable_sales_forecasting`
- `enable_centralized_menu`

[See `prisma/seeds/features.ts` for complete list of 80+ features]

---

## Business Types

1. **coffee_shop_takeaway** - Quick checkout, loyalty, modifiers
2. **kebab_shop_takeaway** - Kitchen display, delivery
3. **restaurant_full_service** - Tables, tipping, kitchen, reservations
4. **pizza_takeaway_delivery** - Online ordering, delivery zones
5. **bakery** - Batch tracking, waste management
6. **bar_pub** - Tables, happy hour, quick service
7. **retail_store** - Barcode, suppliers, inventory
8. **food_truck** - Mobile, quick checkout
9. **restaurant_chain** - Multi-location, enterprise features

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/features` | GET | Get feature catalog |
| `/api/business-types` | GET | Get all business type templates |
| `/api/tenant/features` | GET | Get tenant's features |
| `/api/tenant/features` | POST | Enable/disable/reset features |
| `/api/tenant/features/[key]` | GET | Check specific feature |

---

## Debugging

### Check Database

```sql
-- See all features
SELECT featureKey, name, category FROM feature_catalog;

-- See all business types
SELECT typeKey, displayName, category FROM business_type_templates;

-- See features for tenant
SELECT f.featureKey, tf.isEnabled
FROM tenant_features tf
JOIN feature_catalog f ON tf.featureId = f.id
WHERE tf.tenantId = 'YOUR_TENANT_ID';
```

### Check in Code

```typescript
// Server-side
const features = await getTenantFeatures(tenantId)
console.log(features) // { enable_pos: true, enable_tables: false, ... }

// Client-side
const { features } = useTenantFeatures()
console.log(features) // { enable_pos: true, enable_tables: false, ... }
```

---

## Need Help?

See the full documentation:
- `FEATURE_SYSTEM_IMPLEMENTATION_GUIDE.md` - Complete guide
- `BACKEND_DRIVEN_FEATURE_SYSTEM.md` - System design
- `IMPLEMENTATION_COMPLETE.md` - What was built

**Everything is ready to use!** Just run the migration and seed, then start adding `<FeatureGate>` components to your UI.
