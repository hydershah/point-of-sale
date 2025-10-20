# Login Guide - POS System

## ✅ Database Setup Complete!

Your database has been successfully seeded with demo data. You can now log in to the system.

---

## 🔐 Available User Accounts

### 1. **Super Admin** (System-wide Admin)
- **Email:** `admin@pos.com`
- **Password:** `AdminPassword123!`
- **Access:** Super Admin dashboard, manage all tenants
- **URL:** `http://localhost:3000/super-admin`

### 2. **Business Admin** (Demo Tenant)
- **Email:** `admin@demo.com`
- **Password:** `password`
- **Access:** Full access to Demo Coffee Shop POS
- **URL:** `http://localhost:3000/login`
- **Role:** BUSINESS_ADMIN
- **Permissions:**
  - ✅ POS
  - ✅ Inventory Management
  - ✅ Customer Management
  - ✅ Orders & Reports
  - ✅ Settings
  - ✅ User Management

### 3. **Cashier** (Demo Tenant)
- **Email:** `cashier@demo.com`
- **Password:** `password`
- **Access:** Limited access to Demo Coffee Shop POS
- **URL:** `http://localhost:3000/login`
- **Role:** CASHIER
- **Permissions:**
  - ✅ POS Only
  - ❌ No Inventory Management
  - ❌ No Settings Access
  - ❌ No Reports

---

## 🚀 Quick Start

### Step 1: Start the Development Server
```bash
npm run dev
```

### Step 2: Open Your Browser
Navigate to: `http://localhost:3000`

### Step 3: Log In

#### Option A: Business Admin (Recommended for first login)
1. Go to `http://localhost:3000/login`
2. Enter:
   - **Email:** `admin@demo.com`
   - **Password:** `password`
3. Click "Sign In"
4. You'll be redirected to the Dashboard

#### Option B: Cashier (Limited Access)
1. Go to `http://localhost:3000/login`
2. Enter:
   - **Email:** `cashier@demo.com`
   - **Password:** `password`
3. Click "Sign In"
4. You'll see only the POS interface

#### Option C: Super Admin (System Management)
1. Go to `http://localhost:3000/super-admin`
2. Enter:
   - **Email:** `admin@pos.com`
   - **Password:** `AdminPassword123!`
3. Click "Sign In"
4. You'll access the Super Admin dashboard

---

## 📊 Demo Data Included

Your seeded database includes:

### Products (8 items)
- **Beverages:** Espresso, Cappuccino, Latte, Americano
- **Food:** Croissant, Blueberry Muffin
- **Desserts:** Chocolate Chip Cookie, Cheesecake Slice

### Categories
- Beverages
- Food
- Desserts

### Customers (3)
- John Doe (john@example.com)
- Jane Smith (jane@example.com)
- Bob Wilson (bob@example.com)

### Tables (6)
- Table 1 through Table 6 (capacity: 4 each)

### Discounts (1)
- Summer Special (Code: SUMMER10, 10% off orders over $20)

### Business Settings
- Currency: USD ($)
- Tax Rate: 8.5%
- Timezone: America/New_York
- Features Enabled: Inventory, Tables

---

## 🧪 Testing the System

### Test 1: Place an Order (POS)
1. Log in as `admin@demo.com`
2. Click "POS" in the sidebar
3. Click on products to add them to cart
4. Click "Pay with Cash" or "Pay with Card"
5. Confirm the order

### Test 2: Check Inventory
1. Log in as `admin@demo.com`
2. Click "Inventory" in the sidebar
3. View all products
4. Try editing a product
5. Check stock levels

### Test 3: View Orders
1. After placing an order (Test 1)
2. Click "Orders" in the sidebar
3. See your completed order

### Test 4: Test Permissions
1. Log out
2. Log in as `cashier@demo.com`
3. Notice you only see "Dashboard" and "POS" options
4. Try accessing other pages (should be restricted)

---

## 🔧 Environment Configuration

Your `.env` file now includes:

```env
# Seed Configuration
SUPER_ADMIN_EMAIL="admin@pos.com"
SUPER_ADMIN_PASSWORD="AdminPassword123!"
SEED_DEMO_DATA="true"
```

### To Create Production Data (No Demo):
1. Edit `.env` and change:
   ```env
   SEED_DEMO_DATA="false"
   ```
2. Reset the database:
   ```bash
   npx prisma migrate reset --force
   ```
3. Seed again:
   ```bash
   npm run prisma:seed
   ```

This will only create the Super Admin without demo data.

---

## 👥 User Management

### Creating New Users

#### Via Super Admin Dashboard:
1. Log in as Super Admin
2. Navigate to Tenants
3. Create a new tenant
4. Users will be invited via email

#### Via Business Admin:
1. Log in as Business Admin
2. Go to Settings > Users (coming soon)
3. Invite new team members

### User Roles Explained

| Role | Dashboard | POS | Inventory | Customers | Orders | Reports | Settings | Tables |
|------|-----------|-----|-----------|-----------|--------|---------|----------|--------|
| **BUSINESS_ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **MANAGER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **CASHIER** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🛠️ Troubleshooting

### Problem: Can't Log In
**Solution:**
1. Check that the dev server is running (`npm run dev`)
2. Verify you're using the correct email and password
3. Clear browser cache and cookies
4. Try in an incognito/private window

### Problem: "User not found" Error
**Solution:**
1. Re-run the seed:
   ```bash
   npm run prisma:seed
   ```
2. If that fails, reset the database:
   ```bash
   npx prisma migrate reset --force
   ```

### Problem: Database Connection Error
**Solution:**
1. Check PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```
2. Verify database exists:
   ```bash
   psql -U postgres -l | grep pos_db
   ```
3. Check `.env` DATABASE_URL is correct

### Problem: "Invalid Credentials"
**Solution:**
- Double-check you're typing the password correctly
- Demo tenant users: `password` (lowercase, no special chars)
- Super admin: `AdminPassword123!` (with capital A, P, and exclamation)

### Problem: Permissions Error (403)
**Solution:**
- You're logged in as CASHIER but trying to access admin pages
- Log out and log in as `admin@demo.com`

---

## 🔒 Security Notes

⚠️ **IMPORTANT FOR PRODUCTION:**

1. **Change All Passwords**
   - Never use `password` in production
   - Super Admin password should be 16+ characters
   - Use password managers

2. **Update `.env` File**
   ```env
   NEXTAUTH_SECRET="[Generate new secret: openssl rand -base64 32]"
   SUPER_ADMIN_PASSWORD="[Your secure password]"
   SEED_DEMO_DATA="false"
   ```

3. **Disable Demo Mode**
   - Set `SEED_DEMO_DATA="false"`
   - Remove demo tenant and users

4. **Enable HTTPS**
   - Update `NEXTAUTH_URL` to use `https://`
   - Configure SSL certificates

5. **Database Security**
   - Change default PostgreSQL password
   - Use strong database credentials
   - Enable SSL for database connections

---

## 📝 Next Steps

1. ✅ **Explore the POS System**
   - Test all features with the demo data
   - Try different user roles
   - Place orders, manage inventory

2. ✅ **Customize Settings**
   - Update business name, logo
   - Configure tax rates
   - Set up receipt templates

3. ✅ **Add Real Data**
   - Import your actual products
   - Add real customers
   - Configure tables for your layout

4. ✅ **Test Workflows**
   - Complete order flow
   - Inventory management
   - Reports and analytics

5. ✅ **Prepare for Production**
   - Change all passwords
   - Configure email (Resend)
   - Set up payment gateway (Stripe)
   - Deploy to production server

---

## 🎉 You're Ready to Go!

Your POS system is now fully functional with:
- ✅ User authentication working
- ✅ Demo data seeded
- ✅ Multiple user roles configured
- ✅ UX improvements applied
- ✅ Mobile responsive design

Log in and start testing! 🚀

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the error logs in the terminal
3. Check browser console for errors (F12)

Happy selling! 💰
