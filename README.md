# Multi-Tenant POS System

A comprehensive, multi-tenant Point of Sale platform built with Next.js, supporting retail shops, restaurants, coffee shops, and takeaways with full hardware integration.

## Features

### Multi-Tenancy
- **Super Admin Panel**: Manage all business tenants from a central dashboard
- **One-Click Provisioning**: Create new tenant instances with unique subdomains
- **Complete Isolation**: Each business has isolated data and settings
- **Subscription Management**: Stripe integration for billing (Basic, Pro, Enterprise plans)

### Core POS Features
- **Touch-Optimized Checkout**: Fast, intuitive POS interface
- **Product Management**: Categories, SKUs, barcodes, modifiers
- **Inventory Tracking**: Real-time stock levels, low stock alerts
- **Multiple Payment Methods**: Cash, card, split payments
- **Order Management**: Unique ticket IDs, order numbers per tenant
- **Customer Database**: Track customers, order history, loyalty points

### Hardware Integration
- **Thermal Printer Support**: ESC/POS commands for receipt printing
- **Cash Drawer Control**: Automatic drawer opening
- **Barcode Scanner**: Web Serial API integration
- **Customizable Receipts**: Configure headers, footers, branding

### Restaurant Features
- **Table Management**: Visual floor plan, table status
- **Kitchen Display System**: Real-time order updates (Socket.io)
- **Order Types**: Dine-in, takeaway, delivery
- **Split Bills**: By item or amount

### Business Management
- **Reports & Analytics**: Sales reports, top products, payment methods
- **Ledger & Accounting**: Transaction history, daily sales, tax reports
- **User Management**: Multi-level roles (Admin, Manager, Cashier)
- **Shift Management**: Opening/closing cash counts
- **Discounts & Promotions**: Coupon codes, percentage/fixed discounts

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Payments**: Stripe
- **Email**: Resend
- **Real-time**: Socket.io (for kitchen display)
- **File Storage**: AWS S3 / Cloudinary

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd "point of sale"
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pos_db"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
# Add other variables as needed
```

4. **Setup database**
```bash
npm run prisma:generate
npm run prisma:push
```

5. **Seed sample data**
```bash
npm run prisma:seed
```

6. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000`

## Login Credentials (After Seeding)

### Super Admin
- **URL**: `http://localhost:3000/login` (with super admin header)
- **Email**: `admin@pos.com`
- **Password**: `admin123`

### Demo Tenant (subdomain: demo)
- **URL**: `http://demo.localhost:3000/login`
- **Admin Email**: `admin@demo.com`
- **Admin Password**: `password`
- **Cashier Email**: `cashier@demo.com`
- **Cashier Password**: `password`

## Development Notes

### Subdomain Testing in Development

For local subdomain testing, you can:

1. **Use hosts file** (`/etc/hosts` on Mac/Linux, `C:\Windows\System32\drivers\etc\hosts` on Windows):
```
127.0.0.1 demo.localhost
127.0.0.1 admin.localhost
```

2. **Use custom headers** (via middleware):
```
x-tenant-subdomain: demo
x-super-admin: true
```

### Database Migrations

```bash
# Generate migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Prisma Studio

View and edit database data:
```bash
npm run prisma:studio
```

## Project Structure

```
/point of sale/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts             # Seed data
├── src/
│   ├── app/
│   │   ├── (super-admin)/  # Super admin panel
│   │   ├── (tenant)/       # Tenant POS app
│   │   ├── (auth)/         # Authentication pages
│   │   └── api/            # API routes
│   ├── components/
│   │   ├── ui/            # UI components (shadcn/ui)
│   │   ├── pos/           # POS-specific components
│   │   └── super-admin/   # Super admin components
│   ├── lib/
│   │   ├── prisma.ts      # Prisma client
│   │   ├── auth.ts        # NextAuth configuration
│   │   ├── tenant.ts      # Tenant resolution
│   │   ├── utils.ts       # Utility functions
│   │   └── hardware/      # Hardware integration
│   └── types/             # TypeScript types
├── package.json
└── README.md
```

## API Routes

### Super Admin APIs
- `POST /api/super-admin/tenants` - Create new tenant
- `GET /api/super-admin/tenants` - List all tenants

### Tenant APIs
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/tables` - List tables (restaurant)
- `POST /api/tables` - Create table
- `GET /api/reports` - Generate reports
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

## Multi-Tenant Architecture

### Tenant Isolation
- Database: Single database with `tenantId` column on all tenant-scoped tables
- Middleware: Automatic subdomain resolution and tenant context injection
- Row-Level Security: All queries automatically filtered by tenant
- File Storage: Tenant-specific folders in S3/Cloudinary

### Subdomain Routing
- `admin.yourdomain.com` → Super Admin Panel
- `{tenant}.yourdomain.com` → Tenant POS App
- Middleware resolves tenant from subdomain

### Subscription Tiers

**Basic Plan** ($29/month)
- Single location
- Up to 5 users
- Basic reporting
- Standard support

**Pro Plan** ($79/month)
- Multiple locations
- Unlimited users
- Advanced analytics
- Kitchen display system
- Priority support

**Enterprise Plan** ($199/month)
- Custom features
- API access
- White-label options
- Dedicated support
- Custom integrations

## Hardware Setup

### Thermal Printer
1. Configure printer IP and port in Settings
2. Printer must support ESC/POS commands
3. Common port: 9100 (network printers)

### Barcode Scanner
- USB barcode scanners work as keyboard input
- Web Serial API for advanced integration
- Configure in tenant settings

### Cash Drawer
- Connected via printer (RJ11/RJ12)
- Triggered automatically on cash payment

## Production Deployment

### Environment Variables
Ensure all production environment variables are set:
- Database URL
- NextAuth secret and URL
- Stripe keys
- AWS/Cloudinary credentials
- Email service API keys

### Database
- Use managed PostgreSQL (AWS RDS, Heroku Postgres, etc.)
- Run migrations: `npx prisma migrate deploy`
- Enable connection pooling

### Deployment Platforms
- **Vercel**: Recommended for Next.js
- **AWS**: EC2 + RDS
- **DigitalOcean**: App Platform or Droplets
- **Railway**: Easy deployment with PostgreSQL

### DNS Configuration
Set up wildcard DNS for subdomains:
```
A    @              -> your-server-ip
A    *              -> your-server-ip
CNAME admin         -> yourdomain.com
```

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Offline mode with sync
- [ ] Multi-location support
- [ ] Employee time tracking
- [ ] Advanced inventory (purchase orders, suppliers)
- [ ] Customer-facing display
- [ ] QR code ordering
- [ ] Delivery integration (UberEats, DoorDash)
- [ ] Advanced analytics and forecasting
- [ ] API for third-party integrations

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@yourdomain.com or join our Discord community.

## Acknowledgments

- Built with Next.js and shadcn/ui
- Hardware integration inspired by node-thermal-printer
- Multi-tenancy architecture based on industry best practices

