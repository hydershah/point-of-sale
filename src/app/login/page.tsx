"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        const errorMsg = "Invalid email or password. Please check your credentials and try again."
        setError(errorMsg)
        toast({
          title: "Login Failed",
          description: errorMsg,
          variant: "destructive",
        })
        setLoading(false)
      } else if (result?.ok) {
        setError("")
        toast({
          title: "Success",
          description: "Logged in successfully",
        })

        // Fetch session to determine user role
        const response = await fetch("/api/auth/session")
        const session = await response.json()

        const clearTenantCookie = () => {
          document.cookie = "tenant_subdomain=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        }

        // Redirect based on user role
        if (session?.user?.role === "SUPER_ADMIN") {
          clearTenantCookie()
          window.location.href = "/super-admin/dashboard"
        } else {
          const tenantSubdomain = session?.user?.tenantSubdomain
          if (tenantSubdomain) {
            document.cookie = `tenant_subdomain=${tenantSubdomain}; path=/; max-age=${60 * 60 * 24 * 30}`
          }
          window.location.href = "/dashboard"
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      const errorMsg = "An unexpected error occurred. Please try again."
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access the POS system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
