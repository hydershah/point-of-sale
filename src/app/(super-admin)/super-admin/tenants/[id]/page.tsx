import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Suspense } from "react"
import TenantAdminControls from "./admin-controls"

export const dynamic = 'force-dynamic'

export default async function TenantDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const tenant = await prisma.tenants.findUnique({
    where: { id: params.id },
    include: {
      subscriptions: true,
      _count: {
        select: { users: true, orders: true, products: true },
      },
    },
  })

  if (!tenant) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Tenant not found</h1>
          <p className="text-muted-foreground">The requested tenant does not exist.</p>
        </div>
        <Link href="/super-admin/tenants">
          <Button variant="outline">Back to Tenants</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{tenant.name}</h1>
          <p className="text-muted-foreground">
            {tenant.subdomain}.yourdomain.com
          </p>
        </div>
        <Link href="/super-admin/tenants">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={tenant.status === "ACTIVE" ? "default" : "secondary"}>
                {tenant.status}
              </Badge>
              <Badge variant="outline">{tenant.businessType}</Badge>
            </div>
            <div className="text-sm">
              Created {formatDate(tenant.createdAt)}
            </div>
            <div className="text-sm">
              Email: {tenant.email}
            </div>
            {tenant.phone && (
              <div className="text-sm">Phone: {tenant.phone}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenant.subscriptions ? (
              <>
                <div className="text-sm">Plan: <Badge variant="outline">{tenant.subscriptions.plan}</Badge></div>
                <div className="text-sm">Status: {tenant.subscriptions.status}</div>
                <div className="text-sm">Billing: {tenant.subscriptions.interval} • ${tenant.subscriptions.amount.toFixed(2)}</div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No subscription record</div>
            )}
            <Suspense>
              <TenantAdminControls
                tenantId={tenant.id}
                initialTenantStatus={tenant.status as any}
                initialPlan={(tenant.subscriptions?.plan || 'BASIC') as any}
                initialSubStatus={(tenant.subscriptions?.status || 'TRIALING') as any}
                initialTemplateId={(tenant as any).businessTemplateId || null}
              />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Counts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">Users: {tenant._count.users}</div>
            <div className="text-sm">Orders: {tenant._count.orders}</div>
            <div className="text-sm">Products: {tenant._count.products}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {tenant.address && <div>Address: {tenant.address}</div>}
          {tenant.logo && (
            <div className="flex items-center gap-2">
              <span>Logo:</span>
              <Image
                src={tenant.logo}
                alt="Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain border rounded"
                unoptimized
              />
            </div>
          )}
          {tenant.primaryColor && (
            <div className="flex items-center gap-2">
              <span>Primary color:</span>
              <div
                className="h-4 w-8 rounded border"
                style={{ backgroundColor: tenant.primaryColor }}
              />
            </div>
          )}
          <div className="pt-2">
            <Link href={`/super-admin/tenants/${tenant.id}/features`}>
              <Button variant="outline" size="sm">Manage Features</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// client admin controls moved to ./admin-controls
