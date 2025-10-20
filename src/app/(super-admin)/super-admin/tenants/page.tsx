import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export default async function TenantsPage() {
  const tenants = await prisma.tenants.findMany({
    include: {
      subscriptions: true,
      _count: {
        select: {
          users: true,
          orders: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">
            Manage all business tenants
          </p>
        </div>
        <Link href="/super-admin/tenants/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tenants ({tenants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{tenant.name}</h3>
                    <Badge
                      variant={tenant.status === "ACTIVE" ? "default" : "secondary"}
                    >
                      {tenant.status}
                    </Badge>
                    <Badge variant="outline">{tenant.businessType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {tenant.subdomain}.yourdomain.com
                  </p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{tenant._count.users} users</span>
                    <span>{tenant._count.orders} orders</span>
                    <span>Created {formatDate(tenant.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right">
                  {tenant.subscriptions && (
                    <p className="text-sm font-medium mb-2">
                      {tenant.subscriptions.plan} Plan
                    </p>
                  )}
                  <Link href={`/super-admin/tenants/${tenant.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            {tenants.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No tenants yet. Create your first tenant to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
