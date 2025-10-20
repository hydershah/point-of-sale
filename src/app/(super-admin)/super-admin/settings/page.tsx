"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Shield, Key, Bell, Database, Mail } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async (section: string) => {
    setLoading(true)
    // Simulate save
    setTimeout(() => {
      toast({
        title: "Settings saved",
        description: `${section} settings have been updated successfully.`,
      })
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure platform-wide settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Super Admin Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Super Admin Profile</CardTitle>
            </div>
            <CardDescription>
              Manage your super admin account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                defaultValue="Super Admin"
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue="admin@pos.com"
                placeholder="your@email.com"
              />
            </div>
            <Button onClick={() => handleSave("Profile")} disabled={loading}>
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Update your password and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
              />
            </div>
            <Button onClick={() => handleSave("Security")} disabled={loading}>
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Tenant Registration</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when a new tenant signs up
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Subscription Expiry</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when subscriptions are expiring
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Payment Failures</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about failed payment attempts
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">System Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about critical system issues
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <Button onClick={() => handleSave("Notifications")} disabled={loading}>
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure SMTP settings for email notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input
                id="smtp-host"
                type="text"
                placeholder="smtp.example.com"
                defaultValue=""
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  placeholder="587"
                  defaultValue="587"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-secure">Encryption</Label>
                <select
                  id="smtp-secure"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  defaultValue="tls"
                >
                  <option value="none">None</option>
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-username">SMTP Username</Label>
              <Input
                id="smtp-username"
                type="text"
                placeholder="username@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">SMTP Password</Label>
              <Input
                id="smtp-password"
                type="password"
                placeholder="Enter SMTP password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-email">From Email</Label>
              <Input
                id="from-email"
                type="email"
                placeholder="noreply@yourpos.com"
              />
            </div>
            <Button onClick={() => handleSave("Email")} disabled={loading}>
              Save Email Settings
            </Button>
          </CardContent>
        </Card>

        {/* Database & Backup */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Database & Backup</CardTitle>
            </div>
            <CardDescription>
              Manage database and backup settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Database Status</Label>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-muted-foreground">Connected</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Automatic Backups</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Daily backups at 2:00 AM
                </span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Last Backup</Label>
              <p className="text-sm text-muted-foreground">
                Today at 2:00 AM (Success)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Backup initiated",
                    description: "Database backup has been started.",
                  })
                }}
              >
                Backup Now
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Feature coming soon",
                    description: "Restore functionality will be available soon.",
                  })
                }}
              >
                Restore
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Configuration</CardTitle>
            <CardDescription>
              Configure platform-wide settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input
                id="platform-name"
                type="text"
                defaultValue="POS System"
                placeholder="Your platform name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                defaultValue="support@pos.com"
                placeholder="support@yourpos.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-currency">Default Currency</Label>
              <select
                id="default-currency"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                defaultValue="USD"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-tenants">Maximum Tenants</Label>
              <Input
                id="max-tenants"
                type="number"
                defaultValue="100"
                placeholder="100"
              />
            </div>
            <Button onClick={() => handleSave("Platform")} disabled={loading}>
              Save Platform Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
