// Enhanced Kitchen Display System with real-time updates
import { io, Socket } from 'socket.io-client'
import { OrderStatus } from '@prisma/client'

export interface KDSOrder {
  id: string
  orderNumber: number
  ticketId: string
  tableName?: string
  type: string
  status: OrderStatus
  items: Array<{
    id: string
    name: string
    quantity: number
    modifiers?: any
    notes?: string
  }>
  notes?: string
  createdAt: Date
  estimatedTime?: number
}

// Socket.IO client for real-time updates
let socket: Socket | null = null

// Initialize KDS connection
export function initializeKDS(tenantId: string): Socket {
  if (socket?.connected) {
    return socket
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'

  socket = io(socketUrl, {
    path: process.env.NEXT_PUBLIC_SOCKET_IO_PATH || '/socket.io',
    transports: ['websocket', 'polling'],
    auth: {
      tenantId,
    },
  })

  socket.on('connect', () => {
    console.log('[KDS] Connected to server')
    socket?.emit('join-kds', { tenantId })
  })

  socket.on('disconnect', () => {
    console.log('[KDS] Disconnected from server')
  })

  socket.on('error', (error) => {
    console.error('[KDS] Socket error:', error)
  })

  return socket
}

// Disconnect from KDS
export function disconnectKDS(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Subscribe to new orders
export function onNewOrder(callback: (order: KDSOrder) => void): () => void {
  if (!socket) {
    console.warn('[KDS] Socket not initialized')
    return () => {}
  }

  socket.on('new-order', callback)

  return () => {
    socket?.off('new-order', callback)
  }
}

// Subscribe to order status updates
export function onOrderStatusUpdate(
  callback: (data: { orderId: string; status: OrderStatus }) => void
): () => void {
  if (!socket) {
    console.warn('[KDS] Socket not initialized')
    return () => {}
  }

  socket.on('order-status-update', callback)

  return () => {
    socket?.off('order-status-update', callback)
  }
}

// Update order status
export function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): void {
  if (!socket) {
    console.warn('[KDS] Socket not initialized')
    return
  }

  socket.emit('update-order-status', { orderId, status })
}

// Mark order as preparing
export function markOrderPreparing(orderId: string): void {
  updateOrderStatus(orderId, OrderStatus.PREPARING)
}

// Mark order as ready
export function markOrderReady(orderId: string): void {
  updateOrderStatus(orderId, OrderStatus.READY)
}

// Mark order as completed
export function markOrderCompleted(orderId: string): void {
  updateOrderStatus(orderId, OrderStatus.COMPLETED)
}

// Calculate estimated preparation time based on items
export function calculateEstimatedTime(items: KDSOrder['items']): number {
  // Base time: 5 minutes
  let estimatedMinutes = 5

  // Add 2 minutes per item
  estimatedMinutes += items.length * 2

  // Add extra time for complex modifiers
  for (const item of items) {
    if (item.modifiers && Object.keys(item.modifiers).length > 0) {
      estimatedMinutes += 2
    }
  }

  return Math.min(estimatedMinutes, 30) // Cap at 30 minutes
}

// Group orders by status for KDS display
export function groupOrdersByStatus(orders: KDSOrder[]) {
  return {
    pending: orders.filter((o) => o.status === OrderStatus.PENDING),
    preparing: orders.filter((o) => o.status === OrderStatus.PREPARING),
    ready: orders.filter((o) => o.status === OrderStatus.READY),
  }
}

// Sort orders by priority (oldest first)
export function sortOrdersByPriority(orders: KDSOrder[]): KDSOrder[] {
  return [...orders].sort((a, b) => {
    // First by status priority
    const statusPriority = {
      [OrderStatus.PENDING]: 1,
      [OrderStatus.PREPARING]: 2,
      [OrderStatus.READY]: 3,
      [OrderStatus.COMPLETED]: 4,
      [OrderStatus.CANCELLED]: 5,
    }

    const aPriority = statusPriority[a.status] || 99
    const bPriority = statusPriority[b.status] || 99

    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }

    // Then by age (oldest first)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

// Get order age in minutes
export function getOrderAge(order: KDSOrder): number {
  const now = new Date().getTime()
  const created = new Date(order.createdAt).getTime()
  return Math.floor((now - created) / 60000)
}

// Check if order is overdue
export function isOrderOverdue(order: KDSOrder): boolean {
  const age = getOrderAge(order)
  const estimatedTime = order.estimatedTime || 15

  return age > estimatedTime
}

// Get order priority color
export function getOrderPriorityColor(order: KDSOrder): string {
  const age = getOrderAge(order)
  const estimatedTime = order.estimatedTime || 15

  if (age > estimatedTime * 1.5) {
    return 'red' // Critical - very overdue
  } else if (age > estimatedTime) {
    return 'orange' // Warning - overdue
  } else if (age > estimatedTime * 0.75) {
    return 'yellow' // Caution - approaching deadline
  }

  return 'green' // Normal
}

// Play notification sound
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return

  const audio = new Audio('/sounds/notification.mp3')
  audio.play().catch((error) => {
    console.error('[KDS] Failed to play notification:', error)
  })
}

// Send browser notification
export async function sendBrowserNotification(
  title: string,
  body: string
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return
  }

  const permission = await Notification.requestPermission()

  if (permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'kds-order',
      requireInteraction: true,
    })
  }
}
