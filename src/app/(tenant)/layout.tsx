import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCurrentTenant } from "@/lib/tenant"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Utensils,
} from "lucide-react"

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const tenant = await getCurrentTenant()

  if (!session || !tenant) {
    redirect("/login")
  }

  // Ensure user belongs to this tenant
  if (session.user.tenantId !== tenant.id) {
    redirect("/login")
  }

  const showRestaurantFeatures = tenant.businessType === "RESTAURANT" || tenant.businessType === "MIXED"

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-primary">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">{session.user.name}</p>
          <p className="text-xs text-muted-foreground">{session.user.role}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-auto">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          
          <Link href="/pos">
            <Button variant="ghost" className="w-full justify-start">
              <ShoppingCart className="mr-2 h-4 w-4" />
              POS
            </Button>
          </Link>

          {showRestaurantFeatures && (
            <Link href="/tables">
              <Button variant="ghost" className="w-full justify-start">
                <Utensils className="mr-2 h-4 w-4" />
                Tables
              </Button>
            </Link>
          )}

          {(session.user.role === "BUSINESS_ADMIN" || session.user.role === "MANAGER") && (
            <>
              <Link href="/inventory">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Inventory
                </Button>
              </Link>

              <Link href="/customers">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Customers
                </Button>
              </Link>

              <Link href="/orders">
                <Button variant="ghost" className="w-full justify-start">
                  <Receipt className="mr-2 h-4 w-4" />
                  Orders
                </Button>
              </Link>

              <Link href="/reports">
                <Button variant="ghost" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reports
                </Button>
              </Link>
            </>
          )}

          {session.user.role === "BUSINESS_ADMIN" && (
            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

