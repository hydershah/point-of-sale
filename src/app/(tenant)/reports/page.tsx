"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, TrendingUp, DollarSign, ShoppingCart } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { FeatureGate } from "@/components/feature-gate"
import Link from "next/link"

export const dynamic = 'force-dynamic'

interface ReportData {
  summary: {
    totalSales: number
    totalOrders: number
    averageOrderValue: number
    topProduct: string
    totalCancelled: number
    cancelledCount: number
  }
  dailySales: Array<{
    date: string
    sales: number
    orders: number
  }>
  productSales: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  paymentMethods: Array<{
    method: string
    count: number
    total: number
  }>
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("week")
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/reports?period=${period}`)
      if (!response.ok) {
        throw new Error("Failed to fetch report data")
      }
      const reportData = await response.json()

      // Validate response structure
      if (!reportData.summary) {
        throw new Error("Invalid report data structure")
      }

      setData(reportData)
    } catch (error: any) {
      console.error("Failed to load report:", error)
      setError(error.message || "Failed to load reports")
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error || "Failed to load reports"}</p>
          <Button onClick={loadReport}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <FeatureGate
      feature="enable_basic_reports"
      fallback={
        <div className="p-8">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Reports Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Reports are disabled for your tenant. Enable &quot;Basic Reports&quot; in Feature Settings to access analytics.
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
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Business performance insights
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-2">
            <Button
              variant={period === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("today")}
            >
              Today
            </Button>
            <Button
              variant={period === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("week")}
            >
              This Week
            </Button>
            <Button
              variant={period === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("month")}
            >
              This Month
            </Button>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.totalSales)}
            </div>
            <p className="text-xs text-muted-foreground">
              Excludes cancelled orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Completed orders only
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Order Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per completed order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {data.summary.topProduct}
            </div>
            <p className="text-xs text-muted-foreground">Best seller</p>
          </CardContent>
        </Card>
      </div>

      {/* Cancelled Orders Card */}
      {data.summary.cancelledCount > 0 && (
        <div className="mb-8">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Cancelled Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Cancelled</p>
                  <p className="text-2xl font-bold text-destructive">
                    {data.summary.cancelledCount} {data.summary.cancelledCount === 1 ? 'order' : 'orders'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Refunded Amount</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(data.summary.totalCancelled)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.dailySales.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{formatDate(day.date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {day.orders} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(day.sales)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.productSales.slice(0, 10).map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity} sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.paymentMethods.map((method) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{method.method}</p>
                    <p className="text-sm text-muted-foreground">
                      {method.count} transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(method.total)}</p>
                    <p className="text-xs text-muted-foreground">
                      {((method.total / data.summary.totalSales) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </FeatureGate>
  )
}
