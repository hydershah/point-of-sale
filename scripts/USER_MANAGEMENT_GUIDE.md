# User Management Guide for Supabase

## Overview
This guide explains how to check users and reset passwords in your Supabase database.

## User Types

### 1. Super Admins (`super_admins` table)
- Global administrators who can manage all tenants
- Fields: `id`, `email`, `password`, `name`, `createdAt`, `updatedAt`

### 2. Tenant Users (`users` table)
- Users belonging to specific tenants
- Roles: `BUSINESS_ADMIN`, `MANAGER`, `CASHIER`
- Fields: `id`, `email`, `password`, `name`, `role`, `tenantId`, `isActive`

## How to Check Users

### In Supabase Dashboard:

1. **Go to Supabase Dashboard** → https://app.supabase.com
2. **Select your project**
3. **Click "SQL Editor"** in the left sidebar
4. **Copy and run queries from** `scripts/check-users.sql`

### Available Queries:

```sql
-- View all super admins
SELECT * FROM super_admins;

-- View all tenant users
SELECT u.*, t.subdomain 
FROM users u 
JOIN tenants t ON u.tenant_id = t.id;

-- View users for a specific tenant
SELECT * FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE t.subdomain = 'your-tenant-subdomain';
```

## How to Reset Passwords

### ⚠️ IMPORTANT: Security Notes

1. **Never use default passwords in production**
2. **Always use strong, unique passwords**
3. **Force users to change password on first login**
4. **Use proper password reset flows with email verification**

### Method 1: Generate Password Hash (Recommended)

1. **Run the password hash generator:**
   ```bash
   cd "/Users/hyder/point of sale"
   node scripts/generate-password-hash.js yourNewPassword123
   ```

2. **Copy the generated hash**

3. **Run the SQL update in Supabase:**
   ```sql
   -- For super admin
   UPDATE super_admins 
   SET password = 'YOUR_GENERATED_HASH', updated_at = NOW() 
   WHERE email = 'admin@example.com';
   
   -- For tenant user
   UPDATE users 
   SET password = 'YOUR_GENERATED_HASH', updated_at = NOW() 
   WHERE email = 'user@example.com';
   ```

### Method 2: Use Pre-made SQL Scripts

1. **Open** `scripts/reset-passwords.sql`
2. **Edit the queries** to include:
   - The user's email
   - Your generated password hash
   - The tenant subdomain (for tenant users)
3. **Run in Supabase SQL Editor**

## Quick Reset Steps

### For Super Admin:

```bash
# 1. Generate hash
node scripts/generate-password-hash.js newPassword123

# 2. Copy the hash and run in Supabase SQL Editor:
UPDATE super_admins 
SET password = 'GENERATED_HASH_HERE', updated_at = NOW() 
WHERE email = 'admin@example.com';

# 3. Verify
SELECT email, name, updated_at FROM super_admins WHERE email = 'admin@example.com';
```

### For Tenant User:

```bash
# 1. Generate hash
node scripts/generate-password-hash.js newPassword123

# 2. Run in Supabase SQL Editor:
UPDATE users u
SET password = 'GENERATED_HASH_HERE', updated_at = NOW()
FROM tenants t
WHERE u.tenant_id = t.id
  AND u.email = 'user@example.com'
  AND t.subdomain = 'tenant-subdomain';

# 3. Verify
SELECT u.email, u.name, t.subdomain, u.updated_at 
FROM users u 
JOIN tenants t ON u.tenant_id = t.id 
WHERE u.email = 'user@example.com';
```

## Common Tasks

### Find all users for a tenant:
```sql
SELECT u.email, u.name, u.role, u.is_active
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE t.subdomain = 'your-subdomain'
ORDER BY u.role;
```

### List all tenants with user counts:
```sql
SELECT 
  t.subdomain,
  t.name,
  COUNT(u.id) as total_users,
  COUNT(CASE WHEN u.is_active THEN 1 END) as active_users
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
GROUP BY t.id
ORDER BY total_users DESC;
```

### Activate/Deactivate a user:
```sql
-- Deactivate
UPDATE users SET is_active = false WHERE email = 'user@example.com';

-- Activate
UPDATE users SET is_active = true WHERE email = 'user@example.com';
```

### Find user by email:
```sql
-- Super admin
SELECT * FROM super_admins WHERE email = 'admin@example.com';

-- Tenant user
SELECT u.*, t.subdomain, t.name as tenant_name
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'user@example.com';
```

## Default Test Credentials

After seeding, you should have:

### Super Admin:
- Email: `superadmin@pos.com`
- Password: Check your seed file or reset using the scripts above

### Tenant Users:
- Check `prisma/seed.ts` for default tenant users
- Each tenant may have a default admin user

## Troubleshooting

### Password not working after reset:
1. Verify the hash was correctly copied (no extra spaces)
2. Check the `updated_at` timestamp changed
3. Ensure bcrypt salt rounds match (default: 10)

### Can't find user:
1. Check if user exists: `SELECT * FROM users WHERE email = 'email@example.com';`
2. Check if user is in correct tenant
3. Check if user is active: `is_active = true`

### Need to create a new user:
Use the application's user invitation system or run:
```sql
INSERT INTO users (
  id, email, password, name, role, tenant_id, is_active, created_at, updated_at
) VALUES (
  gen_random_uuid()::text,
  'new@example.com',
  'GENERATED_BCRYPT_HASH',
  'User Name',
  'CASHIER',
  (SELECT id FROM tenants WHERE subdomain = 'tenant-subdomain'),
  true,
  NOW(),
  NOW()
);
```

## Security Best Practices

1. ✅ Always use HTTPS
2. ✅ Use strong passwords (min 12 characters)
3. ✅ Enable 2FA for super admins
4. ✅ Regularly audit user access
5. ✅ Remove inactive users
6. ✅ Use password reset emails (not manual resets)
7. ✅ Log all administrative actions
8. ✅ Never commit passwords or hashes to git

## Need Help?

- Check Supabase docs: https://supabase.com/docs
- Review Prisma docs: https://www.prisma.io/docs
- Check application logs for authentication issues

