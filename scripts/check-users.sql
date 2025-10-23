-- ============================================
-- SQL Scripts to Check Users in Supabase
-- ============================================

-- 1. View all Super Admins
SELECT 
    id,
    email,
    name,
    created_at,
    updated_at
FROM super_admins
ORDER BY created_at DESC;

-- 2. View all Tenant Users with their tenants
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.is_active,
    t.name as tenant_name,
    t.subdomain,
    t.status as tenant_status,
    u.created_at
FROM users u
JOIN tenants t ON u.tenant_id = t.id
ORDER BY u.created_at DESC;

-- 3. View users by specific tenant (replace 'your-subdomain' with actual subdomain)
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.is_active,
    u.phone,
    u.created_at
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE t.subdomain = 'your-subdomain'
ORDER BY u.role, u.name;

-- 4. Count users per tenant
SELECT 
    t.subdomain,
    t.name as tenant_name,
    t.status,
    COUNT(u.id) as user_count,
    COUNT(CASE WHEN u.is_active = true THEN 1 END) as active_users,
    COUNT(CASE WHEN u.role = 'BUSINESS_ADMIN' THEN 1 END) as admins,
    COUNT(CASE WHEN u.role = 'MANAGER' THEN 1 END) as managers,
    COUNT(CASE WHEN u.role = 'CASHIER' THEN 1 END) as cashiers
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
GROUP BY t.id, t.subdomain, t.name, t.status
ORDER BY user_count DESC;

-- 5. View inactive users
SELECT 
    u.email,
    u.name,
    u.role,
    t.subdomain,
    u.updated_at
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.is_active = false
ORDER BY u.updated_at DESC;

