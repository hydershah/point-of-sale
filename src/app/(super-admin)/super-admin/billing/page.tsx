import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, CreditCard, Calendar } from "lucide-react"

export default async function BillingPage() {
  const stats = await getBillingStats()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing & Revenue</h1>
        <p className="text-muted-foreground">
          Manage subscriptions and track revenue across all tenants
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {stats.activeSubscriptions} subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.annualRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Projected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSubscriptions} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Basic Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.planBreakdown.BASIC} subscriptions
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${(stats.planBreakdown.BASIC * 29).toFixed(2)}/mo</p>
                  <p className="text-sm text-muted-foreground">$29 each</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.planBreakdown.PRO} subscriptions
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${(stats.planBreakdown.PRO * 79).toFixed(2)}/mo</p>
                  <p className="text-sm text-muted-foreground">$79 each</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enterprise Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.planBreakdown.ENTERPRISE} subscriptions
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${(stats.planBreakdown.ENTERPRISE * 199).toFixed(2)}/mo</p>
                  <p className="text-sm text-muted-foreground">$199 each</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active</span>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{stats.statusBreakdown.ACTIVE}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Trial</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{stats.statusBreakdown.TRIAL}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expired</span>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{stats.statusBreakdown.EXPIRED}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cancelled</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stats.statusBreakdown.CANCELLED}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-medium">{subscription.tenant?.name || "No Tenant"}</p>
                    <Badge
                      variant={
                        subscription.status === "ACTIVE"
                          ? "default"
                          : subscription.status === "TRIAL"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {subscription.status}
                    </Badge>
                    <Badge variant="outline">{subscription.plan}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscription.tenant?.subdomain || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    ${subscription.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    per {subscription.interval}
                  </p>
                </div>
              </div>
            ))}

            {stats.subscriptions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No subscriptions found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function getBillingStats() {
  const [subscriptions, statusCounts, planCounts] = await Promise.all([
    prisma.subscriptions.findMany({
      include: {
        tenant: {
          select: {
            name: true,
            subdomain: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscriptions.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.subscriptions.groupBy({
      by: ["plan"],
      _count: true,
    }),
  ])

  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE")

  const planBreakdown = {
    BASIC: planCounts.find((p) => p.plan === "BASIC")?._count || 0,
    PRO: planCounts.find((p) => p.plan === "PRO")?._count || 0,
    ENTERPRISE: planCounts.find((p) => p.plan === "ENTERPRISE")?._count || 0,
  }

  const statusBreakdown = {
    ACTIVE: statusCounts.find((s) => s.status === "ACTIVE")?._count || 0,
    TRIAL: statusCounts.find((s) => s.status === "TRIAL")?._count || 0,
    EXPIRED: statusCounts.find((s) => s.status === "EXPIRED")?._count || 0,
    CANCELLED: statusCounts.find((s) => s.status === "CANCELLED")?._count || 0,
  }

  const monthlyRevenue =
    planBreakdown.BASIC * 29 +
    planBreakdown.PRO * 79 +
    planBreakdown.ENTERPRISE * 199

  const annualRevenue = monthlyRevenue * 12

  // Calculate expiring soon (simplified - would need endDate field in production)
  const expiringSoon = 0

  return {
    subscriptions,
    totalSubscriptions: subscriptions.length,
    activeSubscriptions: activeSubscriptions.length,
    monthlyRevenue,
    annualRevenue,
    expiringSoon,
    planBreakdown,
    statusBreakdown,
  }
}
