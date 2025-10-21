import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, DollarSign, TrendingUp } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function SuperAdminDashboard() {
  let stats
  try {
    stats = await getStats()
  } catch (error) {
    console.error('Error loading dashboard stats:', error)
    // Return a friendly error page
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of all tenants and platform metrics
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">
              Error loading dashboard data. Please check database connection.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of all tenants and platform metrics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeTenants} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Across all tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">Currently processing</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentTenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tenant.subdomain}.yourdomain.com
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tenant.businessType}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Basic Plan</span>
                <span className="text-2xl font-bold">{stats.subscriptions.BASIC}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pro Plan</span>
                <span className="text-2xl font-bold">{stats.subscriptions.PRO}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enterprise Plan</span>
                <span className="text-2xl font-bold">{stats.subscriptions.ENTERPRISE}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function getStats() {
  try {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      activeOrders,
      recentTenants,
      subscriptions,
    ] = await Promise.all([
      prisma.tenants.count(),
      prisma.tenants.count({ where: { status: "ACTIVE" } }),
      prisma.users.count(),
      prisma.orders.count({
        where: {
          status: { in: ["PENDING", "PREPARING"] },
        },
      }),
      prisma.tenants.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          subdomain: true,
          businessType: true,
        },
      }),
      prisma.subscriptions.groupBy({
        by: ["plan"],
        _count: true,
      }),
    ])

    const subscriptionCounts = {
      BASIC: subscriptions.find((s) => s.plan === "BASIC")?._count || 0,
      PRO: subscriptions.find((s) => s.plan === "PRO")?._count || 0,
      ENTERPRISE: subscriptions.find((s) => s.plan === "ENTERPRISE")?._count || 0,
    }

    // Calculate revenue (simplified - in production, use actual Stripe data)
    const totalRevenue = subscriptionCounts.BASIC * 29 + subscriptionCounts.PRO * 79 + subscriptionCounts.ENTERPRISE * 199

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      activeOrders,
      recentTenants,
      subscriptions: subscriptionCounts,
      totalRevenue,
    }
  } catch (error) {
    console.error('Database error in getStats:', error)
    throw error
  }
}
