"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Menu,
  X,
  Tags,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTenantFeatures } from "@/hooks/use-features"

interface SidebarProps {
  tenant: {
    id: string
    name: string
    businessType: string
  }
  user: {
    name?: string | null
    role: string
  }
}

export function Sidebar({ tenant, user }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const { features } = useTenantFeatures()

  const isAdmin = user.role === "BUSINESS_ADMIN"
  const isManagerOrAdmin = user.role === "BUSINESS_ADMIN" || user.role === "MANAGER"

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pos", label: "POS", icon: ShoppingCart, feature: "enable_pos_interface" },
    { href: "/tables", label: "Tables", icon: Utensils, feature: "enable_table_management" },
    { href: "/inventory", label: "Inventory", icon: Package, feature: "enable_inventory_tracking", role: "managerOrAdmin" as const },
    { href: "/categories", label: "Categories", icon: Tags, feature: "enable_inventory_tracking", role: "managerOrAdmin" as const },
    { href: "/customers", label: "Customers", icon: Users, feature: "enable_customer_database", role: "managerOrAdmin" as const },
    { href: "/orders", label: "Orders", icon: Receipt, feature: "enable_order_history", role: "managerOrAdmin" as const },
    { href: "/reports", label: "Reports", icon: BarChart3, feature: "enable_basic_reports", role: "managerOrAdmin" as const },
    { href: "/settings", label: "Settings", icon: Settings, role: "admin" as const },
  ]

  const passesRole = (role?: "admin" | "managerOrAdmin") => {
    if (!role) return true
    if (role === "admin") return isAdmin
    return isManagerOrAdmin
  }

  const passesFeature = (feature?: string) => {
    if (!feature) return true
    // Optimistic: show items while loading or on error
    if (features === undefined) return true
    return !!features[feature]
  }

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === "/dashboard") {
      return pathname === href || pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary truncate">{tenant.name}</h1>
        <p className="text-sm text-muted-foreground truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.role.replace("_", " ")}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-auto" aria-label="Main navigation">
        {navItems.map(
          (item) =>
            passesRole(item.role) && passesFeature((item as any).feature) && (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className="block"
              >
                <Button
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive(item.href) && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            )
        )}
      </nav>

      <div className="p-4 border-t">
        <LogoutButton />
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-white"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Sidebar */}
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 bg-white border-r flex flex-col z-50 animate-in slide-in-from-left">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}
