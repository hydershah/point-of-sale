"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
import { FeatureGate } from "@/components/feature-gate"
import Link from "next/link"

interface Table {
  id: string
  name: string
  capacity: number
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED"
  currentOrder?: {
    id: string
    orderNumber: number
    total: number
    items: number
  }
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadTables = useCallback(async () => {
    try {
      const response = await fetch("/api/tables")
      const data = await response.json()
      setTables(data.tables || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tables",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    loadTables()
  }, [loadTables])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 border-green-300 hover:bg-green-200"
      case "OCCUPIED":
        return "bg-red-100 border-red-300 hover:bg-red-200"
      case "RESERVED":
        return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200"
      default:
        return "bg-gray-100 border-gray-300"
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "AVAILABLE":
        return "default"
      case "OCCUPIED":
        return "destructive"
      case "RESERVED":
        return "secondary"
      default:
        return "default"
    }
  }

  const handleTableClick = (table: Table) => {
    if (table.status === "OCCUPIED" && table.currentOrder) {
      // Navigate to order details or open order management
      toast({
        title: "Table Order",
        description: `Order #${table.currentOrder.orderNumber} - ${formatCurrency(table.currentOrder.total)}`,
      })
    } else if (table.status === "AVAILABLE") {
      // Open new order for this table
      toast({
        title: "New Order",
        description: `Starting new order for ${table.name}`,
      })
    }
  }

  const availableCount = tables.filter((t) => t.status === "AVAILABLE").length
  const occupiedCount = tables.filter((t) => t.status === "OCCUPIED").length
  const reservedCount = tables.filter((t) => t.status === "RESERVED").length

  return (
    <FeatureGate
      feature="enable_table_management"
      fallback={
        <div className="p-8">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Table Management Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This feature is not enabled for your tenant. Enable "Table Management" in settings to use this page.
              </p>
              <Button asChild>
                <Link href="/settings/features">Go to Feature Settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Table Management</h1>
          <p className="text-muted-foreground">
            View and manage restaurant tables
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Table
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{availableCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold">{occupiedCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reserved</p>
                <p className="text-2xl font-bold">{reservedCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map((table) => (
          <Card
            key={table.id}
            className={`cursor-pointer transition-all border-2 ${getStatusColor(
              table.status
            )}`}
            onClick={() => handleTableClick(table)}
          >
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{table.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Seats {table.capacity}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(table.status)}>
                  {table.status}
                </Badge>
                {table.currentOrder && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium">
                      Order #{table.currentOrder.orderNumber}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(table.currentOrder.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {table.currentOrder.items} items
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No tables configured yet
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Table
          </Button>
        </div>
      )}
    </div>
    </FeatureGate>
  )
}
