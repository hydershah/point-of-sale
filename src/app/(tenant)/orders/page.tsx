"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Printer, Eye } from "lucide-react"
import { formatCurrency, formatDateTime } from "@/lib/utils"

interface Order {
  id: string
  orderNumber: number
  ticketId: string
  type: string
  status: string
  total: number
  createdAt: string
  customerName?: string
  user: {
    name: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    let filtered = orders

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toString().includes(searchQuery) ||
          order.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredOrders(filtered)
  }, [searchQuery, statusFilter, orders])

  const loadOrders = async () => {
    try {
      const response = await fetch("/api/orders?limit=100")
      const data = await response.json()
      setOrders(data.orders || [])
      setFilteredOrders(data.orders || [])
    } catch (error) {
      console.error("Failed to load orders:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      PENDING: "secondary",
      PREPARING: "default",
      READY: "default",
      COMPLETED: "default",
      CANCELLED: "destructive",
    }
    return variants[status] || "default"
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">View and manage all orders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number, ticket ID, or customer..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {["ALL", "PENDING", "PREPARING", "COMPLETED", "CANCELLED"].map(
                (status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </Button>
                )
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      Order #{order.orderNumber}
                    </h3>
                    <Badge variant={getStatusBadge(order.status)}>
                      {order.status}
                    </Badge>
                    <Badge variant="outline">{order.type}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Ticket ID: {order.ticketId}</p>
                    <p>
                      {formatDateTime(order.createdAt)} • Cashier: {order.user.name}
                    </p>
                    {order.customerName && <p>Customer: {order.customerName}</p>}
                    <p className="text-xs">
                      {order.items.length} items •{" "}
                      {order.items
                        .map((item) => `${item.quantity}x ${item.name}`)
                        .join(", ")}
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(order.total)}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Printer className="mr-2 h-4 w-4" />
                      Reprint
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No orders found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

