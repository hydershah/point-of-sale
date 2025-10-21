"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Mail, Phone, MapPin } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { FeatureGate } from "@/components/feature-gate"
import Link from "next/link"
import { useFeature } from "@/hooks/use-features"

export const dynamic = 'force-dynamic'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  loyaltyPoints: number
  totalSpent: number
  visitCount: number
  createdAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const showLoyalty = useFeature('enable_loyalty_program')

  const loadCustomers = useCallback(async () => {
    try {
      const response = await fetch("/api/customers")
      const data = await response.json()
      setCustomers(data.customers || [])
      setFilteredCustomers(data.customers || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    const filtered = customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery)
    )
    setFilteredCustomers(filtered)
  }, [searchQuery, customers])

  return (
    <FeatureGate
      feature="enable_customer_database"
      fallback={
        <div className="p-8">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Customers Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Customer database is disabled for your tenant. Enable it to manage customers.
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
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer database
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                customers.reduce((sum, c) => sum + c.totalSpent, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg. Customer Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.length > 0
                ? formatCurrency(
                    customers.reduce((sum, c) => sum + c.totalSpent, 0) /
                      customers.length
                  )
                : "$0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{customer.name}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {customer.address}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Badge>{customer.visitCount} visits</Badge>
                    {showLoyalty && customer.loyaltyPoints > 0 && (
                      <Badge variant="secondary">
                        {customer.loyaltyPoints} points
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(customer.createdAt)}
                  </p>
                </div>
              </div>
            ))}

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No customers found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </FeatureGate>
  )
}
