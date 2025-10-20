import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCurrentTenant } from "@/lib/tenant"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"

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

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        tenant={{
          id: tenant.id,
          name: tenant.name,
          businessType: tenant.businessType,
        }}
        user={{
          name: session.user.name,
          role: session.user.role,
        }}
      />
      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
      <Toaster />
    </div>
  )
}

