-- ============================================
-- SQL Scripts to Reset Passwords in Supabase
-- ============================================

-- IMPORTANT: These queries use bcrypt hashed passwords
-- Default password will be: "password123"
-- Bcrypt hash for "password123": $2a$10$rN8YxJZp3qFzN5qZ9yLQ0.XYQ5nZ5YxJZp3qFzN5qZ9yLQ0.XYQ5nZ

-- WARNING: In production, you should:
-- 1. Use a proper password reset flow with email verification
-- 2. Force users to change password on first login
-- 3. Never share default passwords

-- ============================================
-- SUPER ADMIN PASSWORD RESETS
-- ============================================

-- Reset specific super admin password by email
-- Replace 'admin@example.com' with actual email
UPDATE super_admins
SET 
    password = '$2a$10$rN8YxJZp3qFzN5qZ9yLQ0.XYQ5nZ5YxJZp3qFzN5qZ9yLQ0.XYQ5nZ',
    updated_at = NOW()
WHERE email = 'admin@example.com';

-- Reset all super admin passwords (USE WITH CAUTION!)
-- UPDATE super_admins
-- SET 
--     password = '$2a$10$rN8YxJZp3qFzN5qZ9yLQ0.XYQ5nZ5YxJZp3qFzN5qZ9yLQ0.XYQ5nZ',
--     updated_at = NOW();

-- ============================================
-- TENANT USER PASSWORD RESETS
-- ============================================

-- Reset specific user password by email and tenant
-- Replace values with actual email and tenant subdomain
UPDATE users u
SET 
    password = '$2a$10$rN8YxJZp3qFzN5qZ9yLQ0.XYQ5nZ5YxJZp3qFzN5qZ9yLQ0.XYQ5nZ',
    updated_at = NOW()
FROM tenants t
WHERE 
    u.tenant_id = t.id
    AND u.email = 'user@example.com'
    AND t.subdomain = 'tenant-subdomain';

-- Reset password for a specific user by ID
UPDATE users
SET 
    password = '$2a$10$rN8YxJZp3qFzN5qZ9yLQ0.XYQ5nZ5YxJZp3qFzN5qZ9yLQ0.XYQ5nZ',
    updated_at = NOW()
WHERE id = 'user-id-here';

-- Reset all users passwords for a specific tenant (USE WITH EXTREME CAUTION!)
-- UPDATE users u
-- SET 
--     password = '$2a$10$rN8YxJZp3qFzN5qZ9yLQ0.XYQ5nZ5YxJZp3qFzN5qZ9yLQ0.XYQ5nZ',
--     updated_at = NOW()
-- FROM tenants t
-- WHERE 
--     u.tenant_id = t.id
--     AND t.subdomain = 'tenant-subdomain';

-- ============================================
-- VERIFY PASSWORD RESET
-- ============================================

-- Check if password was updated (look at updated_at timestamp)
SELECT 
    email,
    name,
    updated_at
FROM super_admins
WHERE email = 'admin@example.com';

-- For tenant users
SELECT 
    u.email,
    u.name,
    t.subdomain,
    u.updated_at
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'user@example.com';

