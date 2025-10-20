# Quick Reference - POS System Improvements

## Installation Commands

\`\`\`bash
# Install dependencies
npm install @upstash/redis resend sharp isomorphic-dompurify socket.io-client
npm install -D @types/dom-serial

# Run migrations
npx prisma migrate dev --name add_improvements
npx prisma generate
\`\`\`

## Environment Variables

\`\`\`env
REDIS_URL=your_redis_url
REDIS_TOKEN=your_redis_token
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_IO_PATH=/socket.io
\`\`\`

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + P` | Go to POS |
| `Ctrl + D` | Go to Dashboard |
| `Ctrl + O` | Go to Orders |
| `Ctrl + I` | Go to Inventory |
| `Ctrl + N` | New Order |
| `Ctrl + Enter` | Process Payment |
| `Ctrl + F` | Search Products |
| `Alt + C` | Quick Cash Payment |
| `Alt + K` | Quick Card Payment |
| `Esc` | Clear Cart |
| `Shift + ?` | Show Help |

## Quick Code Snippets

### Rate Limiting
\`\`\`typescript
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/security/rate-limiter'

const rateLimitResponse = await rateLimitMiddleware(request as any, RATE_LIMITS.api)
if (rateLimitResponse) return rateLimitResponse
\`\`\`

### Audit Logging
\`\`\`typescript
import { logProductChange } from '@/lib/audit-logger'

await logProductChange(tenantId, userId, userName, 'CREATE', product.id, product.name)
\`\`\`

### Inventory Alerts
\`\`\`typescript
import { checkInventoryLevel } from '@/lib/inventory-alerts'

await checkInventoryLevel(tenantId, productId)
\`\`\`

### Send Receipt Email
\`\`\`typescript
import { sendOrderReceipt } from '@/lib/email/receipt-email'

await sendOrderReceipt(orderId, tenantId, customerEmail)
\`\`\`

### Advanced Reports
\`\`\`typescript
import { getProfitMarginReport } from '@/lib/reports/advanced-analytics'

const report = await getProfitMarginReport(tenantId, { startDate, endDate })
\`\`\`

### Real-time Dashboard
\`\`\`typescript
import { initializeRealtimeDashboard, onSalesUpdate } from '@/lib/realtime-dashboard'

const socket = initializeRealtimeDashboard(tenantId)
const unsubscribe = onSalesUpdate((metrics) => setMetrics(metrics))
\`\`\`

### Kitchen Display
\`\`\`typescript
import { initializeKDS, onNewOrder } from '@/lib/kds/kitchen-display'

const socket = initializeKDS(tenantId)
const unsubscribe = onNewOrder((order) => addToQueue(order))
\`\`\`

### Bluetooth Printer
\`\`\`typescript
import { requestBluetoothPrinter, connectBluetoothPrinter, printReceiptBluetooth } from '@/lib/hardware/bluetooth-printer'

const device = await requestBluetoothPrinter()
const connected = await connectBluetoothPrinter(device)
await printReceiptBluetooth(connected, receiptData)
\`\`\`

## New Database Models

1. **Location** - Multi-store management
2. **AuditLog** - Activity tracking
3. **InventoryAlert** - Stock monitoring
4. **TimeEntry** - Employee time tracking
5. **Tip** / **TipSplit** - Tip management
6. **QROrder** - Self-service orders
7. **CustomerAnalytics** - RFM analysis
8. **EmployeePerformance** - Staff metrics

## API Endpoints to Create

- `GET /api/inventory-alerts` - Get alerts
- `GET /api/reports/profit-margin` - Profit reports
- `POST /api/time-tracking` - Clock in/out
- `POST /api/tips` - Record tips
- `GET /api/qr-orders` - QR orders
- `GET /api/customer-analytics` - Customer insights
- `GET /api/employee-performance` - Staff metrics

## Features Summary

### Security ✅
- Rate limiting
- CSRF protection
- Input sanitization
- Audit logging

### Performance ✅
- Database indexes
- Cursor pagination
- Image optimization
- Redis caching (optional)

### UX ✅
- Offline mode
- PWA support
- Keyboard shortcuts
- Receipt emails

### Business ✅
- Multi-location
- Inventory alerts
- Advanced reports
- Time tracking
- Tip management
- QR ordering

### Hardware ✅
- Enhanced KDS
- Bluetooth printers
- Real-time dashboard

### Analytics ✅
- Customer RFM
- Employee performance
- Sales trends
- Profit margins

## Testing Checklist

- [ ] Install dependencies
- [ ] Run migrations
- [ ] Add env variables
- [ ] Test rate limiting
- [ ] Test offline mode
- [ ] Install PWA on mobile
- [ ] Try keyboard shortcuts
- [ ] Send test email
- [ ] Create inventory alert
- [ ] Generate reports
- [ ] Clock in/out
- [ ] Split tips
- [ ] Test QR ordering
- [ ] Connect Bluetooth printer
- [ ] Monitor real-time dashboard

## Support Files

- **Full Guide**: [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
- **Summary**: [IMPROVEMENTS_SUMMARY.md](IMPROVEMENTS_SUMMARY.md)
- **This File**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
