"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const handleLogout = async () => {
    document.cookie = "tenant_subdomain=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  )
}
