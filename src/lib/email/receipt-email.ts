// Receipt email functionality using Resend
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ReceiptEmailData {
  to: string
  customerName: string
  orderNumber: number
  ticketId: string
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
  }>
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  businessName: string
  businessEmail: string
  businessPhone?: string
  businessAddress?: string
  receiptDate: Date
}

// Generate HTML receipt email
function generateReceiptHtml(data: ReceiptEmailData): string {
  const formattedDate = new Date(data.receiptDate).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt #${data.orderNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .business-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .receipt-info {
            margin: 20px 0;
          }
          .receipt-info p {
            margin: 5px 0;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .items-table th {
            background-color: #f4f4f4;
            padding: 10px;
            text-align: left;
            border-bottom: 2px solid #ddd;
          }
          .items-table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          .items-table tr:last-child td {
            border-bottom: none;
          }
          .text-right {
            text-align: right;
          }
          .totals {
            margin-top: 20px;
            border-top: 2px solid #000;
            padding-top: 10px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .total-amount {
            font-size: 20px;
            font-weight: bold;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="business-name">${data.businessName}</div>
          ${data.businessAddress ? `<p>${data.businessAddress}</p>` : ''}
          ${data.businessPhone ? `<p>Phone: ${data.businessPhone}</p>` : ''}
          <p>Email: ${data.businessEmail}</p>
        </div>

        <div class="receipt-info">
          <p><strong>Receipt #${data.orderNumber}</strong></p>
          <p>Ticket ID: ${data.ticketId}</p>
          <p>Date: ${formattedDate}</p>
          <p>Customer: ${data.customerName}</p>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">$${item.price.toFixed(2)}</td>
                <td class="text-right">$${item.subtotal.toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>$${data.subtotal.toFixed(2)}</span>
          </div>
          ${
            data.discount > 0
              ? `
          <div class="totals-row">
            <span>Discount:</span>
            <span>-$${data.discount.toFixed(2)}</span>
          </div>
          `
              : ''
          }
          <div class="totals-row">
            <span>Tax:</span>
            <span>$${data.tax.toFixed(2)}</span>
          </div>
          <div class="totals-row total-amount">
            <span>Total:</span>
            <span>$${data.total.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Payment Method:</span>
            <span>${data.paymentMethod}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is an electronic receipt. No signature required.</p>
        </div>
      </body>
    </html>
  `
}

// Send receipt email
export async function sendReceiptEmail(
  data: ReceiptEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Resend API key not configured')
    }

    const html = generateReceiptHtml(data)

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@pos.com',
      to: data.to,
      subject: `Receipt #${data.orderNumber} from ${data.businessName}`,
      html,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send receipt email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// Generate and send receipt for an order
export async function sendOrderReceipt(
  orderId: string,
  tenantId: string,
  customerEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // This would typically fetch the order from database
    // For now, this is a placeholder structure

    const order = await fetchOrderDetails(orderId, tenantId)

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    return await sendReceiptEmail({
      to: customerEmail,
      customerName: order.customerName || 'Customer',
      orderNumber: order.orderNumber,
      ticketId: order.ticketId,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.paymentMethod,
      businessName: order.businessName,
      businessEmail: order.businessEmail,
      businessPhone: order.businessPhone,
      businessAddress: order.businessAddress,
      receiptDate: order.createdAt,
    })
  } catch (error) {
    console.error('Failed to process receipt email:', error)
    return {
      success: false,
      error: 'Failed to process receipt',
    }
  }
}

// Placeholder for fetching order details
async function fetchOrderDetails(orderId: string, tenantId: string): Promise<any> {
  // This would use Prisma to fetch order details
  // Placeholder for now
  return null
}
