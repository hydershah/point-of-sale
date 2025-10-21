"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

interface Settings {
  businessName: string
  email: string
  phone: string
  address: string
  currency: string
  currencySymbol: string
  taxRate: number
  taxName: string
  receiptHeader: string
  receiptFooter: string
  printerIp: string
  printerPort: number
  enableKitchenDisplay: boolean
  enableTables: boolean
  enableInventory: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings")
      const data = await response.json()
      setSettings(data.settings)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!settings) {
    return (
      <div className="p-8">
        <div className="text-center">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your business settings
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Basic information about your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={settings.businessName}
                onChange={(e) =>
                  setSettings({ ...settings, businessName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) =>
                  setSettings({ ...settings, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax & Currency */}
        <Card>
          <CardHeader>
            <CardTitle>Tax & Currency</CardTitle>
            <CardDescription>
              Configure tax rates and currency settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) =>
                    setSettings({ ...settings, currency: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input
                  id="currencySymbol"
                  value={settings.currencySymbol}
                  onChange={(e) =>
                    setSettings({ ...settings, currencySymbol: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={settings.taxRate}
                  onChange={(e) =>
                    setSettings({ ...settings, taxRate: parseFloat(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxName">Tax Name</Label>
                <Input
                  id="taxName"
                  value={settings.taxName}
                  onChange={(e) =>
                    setSettings({ ...settings, taxName: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Receipt Settings</CardTitle>
            <CardDescription>
              Customize your receipt appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receiptHeader">Receipt Header</Label>
              <Input
                id="receiptHeader"
                value={settings.receiptHeader}
                onChange={(e) =>
                  setSettings({ ...settings, receiptHeader: e.target.value })
                }
                placeholder="Welcome! Thank you for visiting"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptFooter">Receipt Footer</Label>
              <Input
                id="receiptFooter"
                value={settings.receiptFooter}
                onChange={(e) =>
                  setSettings({ ...settings, receiptFooter: e.target.value })
                }
                placeholder="Please come again!"
              />
            </div>
          </CardContent>
        </Card>

        {/* Hardware Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Hardware Settings</CardTitle>
            <CardDescription>
              Configure thermal printer and other hardware
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="printerIp">Printer IP Address</Label>
                <Input
                  id="printerIp"
                  value={settings.printerIp}
                  onChange={(e) =>
                    setSettings({ ...settings, printerIp: e.target.value })
                  }
                  placeholder="192.168.1.100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="printerPort">Printer Port</Label>
                <Input
                  id="printerPort"
                  type="number"
                  value={settings.printerPort}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      printerPort: parseInt(e.target.value),
                    })
                  }
                  placeholder="9100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>
              Enable or disable features based on your subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Kitchen Display System</p>
                <p className="text-sm text-muted-foreground">
                  Real-time order display for kitchen staff
                </p>
              </div>
              <Badge variant={settings.enableKitchenDisplay ? "default" : "secondary"}>
                {settings.enableKitchenDisplay ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Table Management</p>
                <p className="text-sm text-muted-foreground">
                  Manage restaurant tables and reservations
                </p>
              </div>
              <Badge variant={settings.enableTables ? "default" : "secondary"}>
                {settings.enableTables ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Inventory Tracking</p>
                <p className="text-sm text-muted-foreground">
                  Track stock levels and low stock alerts
                </p>
              </div>
              <Badge variant={settings.enableInventory ? "default" : "secondary"}>
                {settings.enableInventory ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
          <Button variant="outline" onClick={loadSettings}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}

