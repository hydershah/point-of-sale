import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, Coffee, ShoppingBag, Utensils } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">POS Platform</h1>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/contact">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Complete POS Solution</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful, multi-tenant point of sale system for retail shops, restaurants, coffee shops, and takeaways.
            Get your own subdomain and start selling in minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Store className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Retail Shops</CardTitle>
              <CardDescription>
                Complete inventory management, barcode scanning, and sales reporting
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Utensils className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Restaurants</CardTitle>
              <CardDescription>
                Table management, kitchen display system, and order tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Coffee className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Coffee Shops</CardTitle>
              <CardDescription>
                Quick service, modifiers, loyalty programs, and more
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <ShoppingBag className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Takeaway</CardTitle>
              <CardDescription>
                Customer management, delivery tracking, and receipt printing
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <h3 className="text-3xl font-bold mb-8">Key Features</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6">
              <h4 className="font-semibold mb-2">Hardware Integration</h4>
              <p className="text-sm text-muted-foreground">
                Thermal printers, cash drawers, and barcode scanners
              </p>
            </div>
            <div className="p-6">
              <h4 className="font-semibold mb-2">Multi-User Support</h4>
              <p className="text-sm text-muted-foreground">
                Admin, manager, and cashier roles with permissions
              </p>
            </div>
            <div className="p-6">
              <h4 className="font-semibold mb-2">Real-Time Analytics</h4>
              <p className="text-sm text-muted-foreground">
                Sales reports, inventory tracking, and insights
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <Link href="/contact">
            <Button size="lg">Request a Demo</Button>
          </Link>
        </div>
      </main>

      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Multi-Tenant POS Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

