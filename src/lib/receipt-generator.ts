/**
 * Receipt Generation and Formatting
 */

import { createPrinter, ReceiptData } from "./hardware/thermal-printer"

export interface OrderData {
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
    modifiers?: string[]
  }>
  subtotal: number
  tax: number
  discount?: number
  total: number
  paymentMethod: string
  amountPaid?: number
  change?: number
  customerName?: string
  customerAddress?: string
  notes?: string
  footer?: string
}

/**
 * Generate receipt data from order
 */
export function generateReceiptData(order: OrderData): ReceiptData {
  return {
    businessName: order.businessName,
    businessAddress: order.businessAddress,
    orderNumber: order.orderNumber,
    ticketId: order.ticketId,
    date: order.date,
    cashier: order.cashier,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.quantity * item.price,
    })),
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    paymentMethod: order.paymentMethod,
    customerName: order.customerName,
    customerAddress: order.customerAddress,
    footer: order.footer,
  }
}

/**
 * Print receipt
 */
export async function printReceipt(
  order: OrderData,
  printerConfig: any
): Promise<void> {
  const printer = createPrinter(printerConfig)
  const receiptData = generateReceiptData(order)
  
  try {
    await printer.print(receiptData)
  } catch (error) {
    console.error("Print error:", error)
    throw error
  }
}

/**
 * Generate kitchen receipt (simplified for kitchen staff)
 */
export function generateKitchenReceipt(order: OrderData): string {
  let receipt = `\n`
  receipt += `========== KITCHEN ORDER ==========\n`
  receipt += `Order #${order.orderNumber}\n`
  receipt += `Ticket: ${order.ticketId}\n`
  receipt += `Time: ${order.date.toLocaleTimeString()}\n`
  
  if (order.customerName) {
    receipt += `Customer: ${order.customerName}\n`
  }
  
  receipt += `===================================\n\n`

  order.items.forEach((item) => {
    receipt += `${item.quantity}x ${item.name}\n`
    if (item.modifiers && item.modifiers.length > 0) {
      receipt += `   ${item.modifiers.join(", ")}\n`
    }
  })

  if (order.notes) {
    receipt += `\nNOTES: ${order.notes}\n`
  }

  receipt += `\n===================================\n`
  
  return receipt
}

/**
 * Format receipt content for storage/reprint
 */
export function formatReceiptContent(order: OrderData): string {
  let content = `${order.businessName}\n`
  if (order.businessAddress) {
    content += `${order.businessAddress}\n`
  }
  content += `\n`
  content += `Order #${order.orderNumber}\n`
  content += `Ticket: ${order.ticketId}\n`
  content += `Date: ${order.date.toLocaleString()}\n`
  content += `Cashier: ${order.cashier}\n`
  
  if (order.customerName) {
    content += `Customer: ${order.customerName}\n`
  }
  
  content += `\n${"=".repeat(42)}\n\n`

  order.items.forEach((item) => {
    const line = `${item.name.padEnd(20)} ${item.quantity}x $${item.price.toFixed(2)}`
    content += `${line}\n`
    content += `${" ".repeat(20)} $${(item.quantity * item.price).toFixed(2)}\n`
    
    if (item.modifiers && item.modifiers.length > 0) {
      content += `  + ${item.modifiers.join(", ")}\n`
    }
  })

  content += `\n${"=".repeat(42)}\n`
  content += `${"Subtotal:".padEnd(32)} $${order.subtotal.toFixed(2)}\n`
  
  if (order.discount && order.discount > 0) {
    content += `${"Discount:".padEnd(32)} -$${order.discount.toFixed(2)}\n`
  }
  
  content += `${"Tax:".padEnd(32)} $${order.tax.toFixed(2)}\n`
  content += `${"TOTAL:".padEnd(32)} $${order.total.toFixed(2)}\n`
  content += `\n`
  content += `Payment Method: ${order.paymentMethod}\n`
  
  if (order.amountPaid && order.change) {
    content += `Amount Paid: $${order.amountPaid.toFixed(2)}\n`
    content += `Change: $${order.change.toFixed(2)}\n`
  }

  if (order.footer) {
    content += `\n${order.footer}\n`
  }

  content += `\nThank you for your business!\n`

  return content
}

