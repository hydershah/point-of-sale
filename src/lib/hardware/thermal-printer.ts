/**
 * Thermal Printer Integration
 * Supports ESC/POS commands for receipt printing
 */

export interface PrinterConfig {
  ip?: string
  port?: number
  type: "network" | "usb" | "browser"
}

export interface ReceiptData {
  businessName: string
  businessAddress?: string
  orderNumber: number
  ticketId: string
  date: Date
  cashier: string
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
  }>
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  customerName?: string
  customerAddress?: string
  footer?: string
}

export class ThermalPrinter {
  private config: PrinterConfig

  constructor(config: PrinterConfig) {
    this.config = config
  }

  /**
   * Generate ESC/POS commands for receipt
   */
  private generateESCPOS(data: ReceiptData): string {
    const ESC = "\x1B"
    const GS = "\x1D"
    
    let receipt = ""

    // Initialize printer
    receipt += `${ESC}@`

    // Center align
    receipt += `${ESC}a1`

    // Bold and large font for business name
    receipt += `${ESC}E1${GS}!01`
    receipt += `${data.businessName}\n`
    receipt += `${ESC}E0${GS}!00`

    if (data.businessAddress) {
      receipt += `${data.businessAddress}\n`
    }

    receipt += `\n`

    // Left align
    receipt += `${ESC}a0`

    // Order info
    receipt += `Order #: ${data.orderNumber}\n`
    receipt += `Ticket: ${data.ticketId}\n`
    receipt += `Date: ${data.date.toLocaleString()}\n`
    receipt += `Cashier: ${data.cashier}\n`
    
    if (data.customerName) {
      receipt += `Customer: ${data.customerName}\n`
      if (data.customerAddress) {
        receipt += `Address: ${data.customerAddress}\n`
      }
    }

    receipt += `\n`
    receipt += `${"-".repeat(42)}\n`

    // Items
    data.items.forEach((item) => {
      const itemLine = `${item.name.substring(0, 20).padEnd(20)} ${item.quantity}x $${item.price.toFixed(2)}`
      receipt += `${itemLine}\n`
      receipt += `${" ".repeat(20)} $${item.subtotal.toFixed(2)}\n`
    })

    receipt += `${"-".repeat(42)}\n`

    // Totals
    receipt += `${"Subtotal:".padEnd(32)} $${data.subtotal.toFixed(2)}\n`
    receipt += `${"Tax:".padEnd(32)} $${data.tax.toFixed(2)}\n`
    
    // Bold for total
    receipt += `${ESC}E1`
    receipt += `${"TOTAL:".padEnd(32)} $${data.total.toFixed(2)}\n`
    receipt += `${ESC}E0`

    receipt += `\n`
    receipt += `Payment Method: ${data.paymentMethod}\n`

    if (data.footer) {
      receipt += `\n`
      receipt += `${ESC}a1` // Center align
      receipt += `${data.footer}\n`
    }

    receipt += `\n\n`
    receipt += `${ESC}a1` // Center align
    receipt += `Thank you for your business!\n`

    // Cut paper
    receipt += `\n\n\n`
    receipt += `${GS}V66\x00`

    return receipt
  }

  /**
   * Generate HTML receipt for browser printing
   */
  private generateHTML(data: ReceiptData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt #${data.orderNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            width: 300px;
            margin: 0 auto;
            padding: 20px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .large { font-size: 18px; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 4px 0; }
          .right { text-align: right; }
          @media print {
            body { margin: 0; padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="bold large">${data.businessName}</div>
          ${data.businessAddress ? `<div>${data.businessAddress}</div>` : ""}
        </div>
        
        <div class="line"></div>
        
        <div>
          <div>Order #: ${data.orderNumber}</div>
          <div>Ticket: ${data.ticketId}</div>
          <div>Date: ${data.date.toLocaleString()}</div>
          <div>Cashier: ${data.cashier}</div>
          ${data.customerName ? `<div>Customer: ${data.customerName}</div>` : ""}
          ${data.customerAddress ? `<div>Address: ${data.customerAddress}</div>` : ""}
        </div>
        
        <div class="line"></div>
        
        <table>
          ${data.items
            .map(
              (item) => `
            <tr>
              <td colspan="2">${item.name}</td>
            </tr>
            <tr>
              <td>${item.quantity} x $${item.price.toFixed(2)}</td>
              <td class="right">$${item.subtotal.toFixed(2)}</td>
            </tr>
          `
            )
            .join("")}
        </table>
        
        <div class="line"></div>
        
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="right">$${data.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Tax:</td>
            <td class="right">$${data.tax.toFixed(2)}</td>
          </tr>
          <tr class="bold">
            <td>TOTAL:</td>
            <td class="right">$${data.total.toFixed(2)}</td>
          </tr>
        </table>
        
        <div class="line"></div>
        
        <div>Payment Method: ${data.paymentMethod}</div>
        
        ${data.footer ? `<div class="center" style="margin-top: 20px;">${data.footer}</div>` : ""}
        
        <div class="center bold" style="margin-top: 20px;">
          Thank you for your business!
        </div>
      </body>
      </html>
    `
  }

  /**
   * Print receipt
   */
  async print(data: ReceiptData): Promise<void> {
    if (this.config.type === "browser") {
      // Use browser print
      const printWindow = window.open("", "", "width=400,height=600")
      if (printWindow) {
        printWindow.document.write(this.generateHTML(data))
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        setTimeout(() => printWindow.close(), 250)
      }
    } else if (this.config.type === "network") {
      // Send to network printer
      // This would require a server-side endpoint or electron app
      const escpos = this.generateESCPOS(data)
      
      try {
        await fetch("/api/print", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            printer: this.config,
            data: escpos,
          }),
        })
      } catch (error) {
        console.error("Print error:", error)
        throw new Error("Failed to print receipt")
      }
    }
  }

  /**
   * Open cash drawer (via printer kick command)
   */
  async openCashDrawer(): Promise<void> {
    const ESC = "\x1B"
    const command = `${ESC}p\x00\x19\xFA`

    if (this.config.type === "network") {
      try {
        await fetch("/api/print", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            printer: this.config,
            data: command,
          }),
        })
      } catch (error) {
        console.error("Cash drawer error:", error)
      }
    }
  }
}

/**
 * Create printer instance
 */
export function createPrinter(config: PrinterConfig): ThermalPrinter {
  return new ThermalPrinter(config)
}

