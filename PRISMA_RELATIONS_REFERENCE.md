# Prisma Relations Reference

## ✅ Quick Fix Applied

All `category` relations have been updated to `categories` in API includes.

---

## 📋 Correct Relation Names

When using `include` in Prisma queries, use these relation names:

### Products Model
```typescript
// ✅ Correct
const product = await prisma.products.findMany({
  include: {
    categories: true,    // Relation to categories
    users: true,         // Relation to users (created by)
    tenants: true,       // Relation to tenants
    order_items: true,   // Relation to order items
  }
})
```

### Users Model
```typescript
// ✅ Correct
const user = await prisma.users.findFirst({
  include: {
    tenants: true,       // Relation to tenant
    products: true,      // Relation to products created
    orders: true,        // Relation to orders created
  }
})
```

### Orders Model
```typescript
// ✅ Correct
const order = await prisma.orders.findMany({
  include: {
    tenants: true,       // Relation to tenant
    customers: true,     // Relation to customer
    tables: true,        // Relation to table
    users: true,         // Relation to user (created by)
    order_items: true,   // Relation to order items
    payments: true,      // Relation to payments
  }
})
```

### Tenants Model
```typescript
// ✅ Correct
const tenant = await prisma.tenants.findFirst({
  include: {
    users: true,               // Relation to users
    products: true,            // Relation to products
    orders: true,              // Relation to orders
    categories: true,          // Relation to categories
    customers: true,           // Relation to customers
    tables: true,              // Relation to tables
    tenant_settings: true,     // Relation to settings
    subscriptions: true,       // Relation to subscription
  }
})
```

---

## 🚨 Common Mistakes

### ❌ Wrong
```typescript
include: {
  category: true,    // WRONG - singular
  tenant: true,      // WRONG - singular
  order: true,       // WRONG - singular
}
```

### ✅ Correct
```typescript
include: {
  categories: true,  // Correct - plural
  tenants: true,     // Correct - plural
  orders: true,      // Correct - plural
}
```

---

## 🔍 How to Find Relation Names

1. Open `prisma/schema.prisma`
2. Find your model
3. Look for relations (they don't have `@` symbol on the field name)
4. Use the exact field name in your `include`

Example from schema:
```prisma
model products {
  // ...
  categories  categories? @relation(fields: [categoryId], references: [id])
  //^^^^^^^^^ This is the relation name to use in include
}
```

---

## 📝 Files Fixed

- ✅ `/src/app/api/products/route.ts` - Changed `category` → `categories`
- ✅ `/src/app/api/products/[id]/route.ts` - Changed `category` → `categories`
- ✅ All other API files with similar patterns

---

## 🎉 Products Should Now Load!

Refresh your browser and products should display correctly in:
- POS page
- Inventory page
- Product dialogs

The error "Failed to fetch products from server" should be resolved!
