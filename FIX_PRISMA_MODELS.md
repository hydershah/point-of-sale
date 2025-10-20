# Prisma Model Name Reference

## ✅ All model names have been updated!

The Prisma models in the schema use **lowercase with underscores**, not PascalCase.

## Correct Model Names

| ❌ Incorrect (Old) | ✅ Correct (New) |
|---|---|
| `prisma.superAdmin` | `prisma.super_admins` |
| `prisma.user` | `prisma.users` |
| `prisma.tenant` | `prisma.tenants` |
| `prisma.product` | `prisma.products` |
| `prisma.order` | `prisma.orders` |
| `prisma.customer` | `prisma.customers` |
| `prisma.category` | `prisma.categories` |
| `prisma.table` | `prisma.tables` |
| `prisma.discount` | `prisma.discounts` |
| `prisma.subscription` | `prisma.subscriptions` |
| `prisma.payment` | `prisma.payments` |
| `prisma.receipt` | `prisma.receipts` |

## Files Updated

The following files have been automatically fixed:
- ✅ `src/lib/auth.ts` - Authentication
- ✅ `src/lib/tenant.ts` - Tenant lookup
- ✅ `src/app/api/**/*.ts` - All API routes
- ✅ `src/app/(tenant)/**/*.tsx` - Tenant pages
- ✅ `src/app/(super-admin)/**/*.tsx` - Super admin pages
- ✅ `prisma/seed.ts` - Seed file

## The Fix Applied

```bash
# Replaced all instances across the codebase
prisma.user → prisma.users
prisma.tenant → prisma.tenants
prisma.product → prisma.products
# ... and so on
```

## Relation Names in Includes

When using `include`, relation names follow the schema definition:

```typescript
// ✅ Correct
const user = await prisma.users.findFirst({
  include: {
    tenants: true  // Relation name from schema
  }
})

// ❌ Incorrect
const user = await prisma.users.findFirst({
  include: {
    tenant: true  // Wrong - this won't work
  }
})
```

## Next Steps

The server should now work correctly. Try logging in again:
- Email: `admin@demo.com`
- Password: `password`

All database operations will now use the correct model names!
