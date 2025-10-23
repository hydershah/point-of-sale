# Quick User Management Commands

## 🔍 Check All Users

### In Supabase SQL Editor:

```sql
-- All Super Admins
SELECT id, email, name, created_at FROM super_admins;

-- All Tenant Users
SELECT u.email, u.name, u.role, t.subdomain, u.is_active
FROM users u
JOIN tenants t ON u.tenant_id = t.id
ORDER BY t.subdomain, u.role;
```

## 🔑 Reset Password (Complete Steps)

### Step 1: Generate Password Hash
```bash
cd "/Users/hyder/point of sale"
node scripts/generate-password-hash.js YourNewPassword123
```

### Step 2A: Reset Super Admin Password
Copy the hash from Step 1 and run in Supabase SQL Editor:
```sql
UPDATE super_admins 
SET 
    password = 'PASTE_HASH_HERE',
    updated_at = NOW() 
WHERE email = 'superadmin@pos.com';
```

### Step 2B: Reset Tenant User Password
Copy the hash from Step 1 and run in Supabase SQL Editor:
```sql
UPDATE users 
SET 
    password = 'PASTE_HASH_HERE',
    updated_at = NOW() 
WHERE email = 'user@example.com';
```

## 📊 Quick Checks

### Find user by email:
```sql
-- Super Admin
SELECT * FROM super_admins WHERE email = 'admin@example.com';

-- Tenant User
SELECT u.*, t.subdomain 
FROM users u 
JOIN tenants t ON u.tenant_id = t.id 
WHERE u.email = 'user@example.com';
```

### Count users per tenant:
```sql
SELECT 
    t.subdomain,
    t.name,
    COUNT(u.id) as user_count
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
GROUP BY t.id
ORDER BY user_count DESC;
```

### Find all admins:
```sql
SELECT u.email, u.name, t.subdomain
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.role = 'BUSINESS_ADMIN'
ORDER BY t.subdomain;
```

## 🎯 Common Tasks

### Activate a user:
```sql
UPDATE users 
SET is_active = true, updated_at = NOW() 
WHERE email = 'user@example.com';
```

### Deactivate a user:
```sql
UPDATE users 
SET is_active = false, updated_at = NOW() 
WHERE email = 'user@example.com';
```

### Change user role:
```sql
UPDATE users 
SET role = 'MANAGER', updated_at = NOW() 
WHERE email = 'user@example.com';
-- Options: BUSINESS_ADMIN, MANAGER, CASHIER
```

### List inactive users:
```sql
SELECT u.email, u.name, t.subdomain, u.updated_at
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.is_active = false
ORDER BY u.updated_at DESC;
```

## 🚀 Access Supabase

1. Go to: https://app.supabase.com
2. Select your project
3. Click "SQL Editor" (left sidebar)
4. Paste and run queries

## 📝 Example: Complete Password Reset

```bash
# 1. Generate hash locally
node scripts/generate-password-hash.js SecurePass123!

# Output will show hash like:
# $2a$10$rvOPuJC1SuP7oxDBFM2V6e/cFMNeFzgdrEUBNfwCgNLr85HY1hZBe

# 2. Go to Supabase SQL Editor and run:
UPDATE users 
SET password = '$2a$10$rvOPuJC1SuP7oxDBFM2V6e/cFMNeFzgdrEUBNfwCgNLr85HY1hZBe', 
    updated_at = NOW() 
WHERE email = 'user@example.com';

# 3. Verify the change:
SELECT email, name, updated_at FROM users WHERE email = 'user@example.com';
```

## ⚠️ Important Notes

- **Never share passwords** - Send reset links instead
- **Use strong passwords** - Minimum 12 characters
- **Test in staging first** - Before making production changes
- **Backup first** - Always have a database backup
- **Log changes** - Keep track of who reset what and when

## 🆘 Troubleshooting

**Problem:** Password reset didn't work
- ✅ Check that `updated_at` timestamp changed
- ✅ Verify no extra spaces in the hash
- ✅ Ensure user email is correct
- ✅ Try generating a new hash

**Problem:** Can't find user
- ✅ Check spelling of email
- ✅ Check if user belongs to correct tenant
- ✅ Check if user is active (`is_active = true`)

**Problem:** User locked out
- ✅ Check `is_active` field
- ✅ Check tenant status (not SUSPENDED)
- ✅ Check subscription status

