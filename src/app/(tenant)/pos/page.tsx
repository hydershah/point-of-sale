"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus, Trash2, CreditCard, DollarSign, Package, ShoppingCart, CheckCircle2, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ProductGridSkeleton } from "@/components/loading-skeleton"
import { EmptyState } from "@/components/empty-state"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { ErrorState } from "@/components/error-state"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  price: number
  category: string
  image?: string
  stock: number
  trackStock: boolean
}

interface CartItem extends Product {
  quantity: number
  subtotal: number
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [showClearCartDialog, setShowClearCartDialog] = useState(false)
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")
  const [addedToCartId, setAddedToCartId] = useState<string | null>(null)
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)
  const { toast } = useToast()

  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true)
    setProductsError(null)
    try {
      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error("Failed to fetch products from server")
      }
      const data = await response.json()
      setProducts(data.products || [])

      // Extract unique categories
      const uniqueCategories = new Set<string>(data.products.map((p: Product) => p.category))
      const cats: string[] = ["All", ...Array.from(uniqueCategories)]
      setCategories(cats)
    } catch (error: any) {
      setProductsError(
        error.message || "Unable to load products. Please check your connection and try again."
      )
    } finally {
      setIsLoadingProducts(false)
    }
  }, [])

  // Load products and categories
  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      // Check stock
      if (product.trackStock && existingItem.quantity >= product.stock) {
        toast({
          title: "Out of Stock",
          description: `Only ${product.stock} available. Cannot add more to cart.`,
          variant: "destructive",
        })
        return
      }

      setCart(
        cart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item
        )
      )
    } else {
      // Check if product has stock
      if (product.trackStock && product.stock === 0) {
        toast({
          title: "Out of Stock",
          description: `${product.name} is currently out of stock.`,
          variant: "destructive",
        })
        return
      }

      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
          subtotal: product.price,
        },
      ])
    }

    // Visual feedback
    setAddedToCartId(product.id)
    setTimeout(() => setAddedToCartId(null), 600)

    // Show success toast
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQuantity = item.quantity + delta
            
            // Check stock
            if (item.trackStock && newQuantity > item.stock) {
              toast({
                title: "Out of Stock",
                description: `Only ${item.stock} available`,
                variant: "destructive",
              })
              return item
            }
            
            if (newQuantity <= 0) return null
            return {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.price,
            }
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setShowClearCartDialog(false)
    toast({
      title: "Cart cleared",
      description: "All items have been removed from the cart.",
    })
  }

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const handleCheckout = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          paymentMethod: selectedPaymentMethod,
          type: "DINE_IN", // Can be made dynamic
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order")
      }

      toast({
        title: "Order Completed",
        description: `Order #${data.order.orderNumber} created successfully. Total: $${getCartTotal().toFixed(2)}`,
      })

      // Clear cart
      setCart([])
      setShowCheckoutDialog(false)
      setSelectedPaymentMethod("")

      // TODO: Print receipt
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to complete order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openCheckoutDialog = (paymentMethod: string) => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to the cart before checking out.",
        variant: "destructive",
      })
      return
    }
    setSelectedPaymentMethod(paymentMethod)
    setShowCheckoutDialog(true)
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row h-screen bg-gray-100">
        {/* Products Section */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search products"
                />
              </div>
              {/* Mobile Cart Toggle */}
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden relative"
                onClick={() => setIsMobileCartOpen(true)}
                aria-label="Open cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cart.length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                  className="whitespace-nowrap"
                  aria-pressed={selectedCategory === category}
                  aria-label={`Filter by ${category}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoadingProducts && <ProductGridSkeleton count={8} />}

          {/* Error State */}
          {productsError && !isLoadingProducts && (
            <ErrorState
              message={productsError}
              onRetry={loadProducts}
            />
          )}

          {/* Products Grid */}
          {!isLoadingProducts && !productsError && products.length === 0 && (
            <EmptyState
              icon={Package}
              title="No products available"
              description="Start by adding products to your inventory. Go to the Inventory page to add your first product."
              actionLabel="Go to Inventory"
              onAction={() => window.location.href = "/inventory"}
            />
          )}

          {!isLoadingProducts && !productsError && products.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.trackStock && product.stock === 0
                  const isAdding = addedToCartId === product.id

                  return (
                    <Card
                      key={product.id}
                      className={cn(
                        "group relative transition-all duration-200",
                        isOutOfStock
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer hover:shadow-lg hover:scale-105",
                        isAdding && "ring-2 ring-primary"
                      )}
                      onClick={() => !isOutOfStock && addToCart(product)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="aspect-square bg-gray-200 rounded-md mb-3 flex items-center justify-center relative overflow-hidden">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover rounded-md"
                            />
                          ) : (
                            <Package className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                          )}
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-xs sm:text-sm font-semibold">
                                Out of Stock
                              </span>
                            </div>
                          )}
                          {isAdding && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <CheckCircle2 className="h-8 w-8 text-primary animate-in zoom-in" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-xs sm:text-sm mb-1 truncate" title={product.name}>
                          {product.name}
                        </h3>
                        <div className="flex items-baseline justify-between">
                          <p className="text-base sm:text-lg font-bold text-primary">
                            ${product.price.toFixed(2)}
                          </p>
                          {product.trackStock && (
                            <p className={cn(
                              "text-xs",
                              product.stock === 0 ? "text-destructive font-medium" :
                              product.stock < 10 ? "text-orange-600" :
                              "text-muted-foreground"
                            )}>
                              {product.stock} left
                            </p>
                          )}
                        </div>
                        {!isOutOfStock && (
                          <Button
                            size="sm"
                            className="w-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              addToCart(product)
                            }}
                            aria-label={`Add ${product.name} to cart`}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Cart
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {filteredProducts.length === 0 && (
                <EmptyState
                  icon={Search}
                  title="No products found"
                  description={`No products match your search "${searchQuery}" in ${selectedCategory === "All" ? "any category" : selectedCategory}.`}
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearchQuery("")
                    setSelectedCategory("All")
                  }}
                />
              )}

              {filteredProducts.length > 0 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
              )}
            </>
          )}
        </div>

        {/* Desktop Cart Section */}
        <div className="hidden lg:flex lg:w-96 bg-white border-l flex-col">
          <CartContent />
        </div>

        {/* Mobile Cart Drawer */}
        {isMobileCartOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileCartOpen(false)}>
            <div
              className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white flex flex-col animate-in slide-in-from-right"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Current Order</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileCartOpen(false)}
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <CartContent />
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={showClearCartDialog}
        onOpenChange={setShowClearCartDialog}
        title="Clear Cart?"
        description="Are you sure you want to remove all items from the cart? This action cannot be undone."
        confirmLabel="Clear Cart"
        cancelLabel="Cancel"
        onConfirm={clearCart}
        variant="destructive"
      />

      <ConfirmationDialog
        open={showCheckoutDialog}
        onOpenChange={setShowCheckoutDialog}
        title="Complete Order"
        description={`Confirm payment of $${getCartTotal().toFixed(2)} via ${selectedPaymentMethod === "CASH" ? "Cash" : "Card"}? This will process the order and clear the cart.`}
        confirmLabel={loading ? "Processing..." : `Charge $${getCartTotal().toFixed(2)}`}
        cancelLabel="Cancel"
        onConfirm={handleCheckout}
        variant="default"
      />
    </>
  )

  function CartContent() {
    return (
      <>
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {cart.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Cart is empty"
              description="Add products to your cart to get started. Click on any product to add it."
            />
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 pb-4 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 shrink-0"
                      onClick={() => updateQuantity(item.id, -1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium" aria-label={`Quantity: ${item.quantity}`}>
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 shrink-0"
                      onClick={() => updateQuantity(item.id, 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="w-16 sm:w-20 text-right font-medium shrink-0">
                    ${item.subtotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t p-4 sm:p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-base sm:text-lg">
                <span>Subtotal:</span>
                <span className="font-medium">${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax (0%):</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-xl sm:text-2xl font-bold pt-2 border-t">
                <span>Total:</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                size="lg"
                onClick={() => openCheckoutDialog("CASH")}
                disabled={loading}
                aria-label="Pay with cash"
              >
                <DollarSign className="mr-2 h-5 w-5" />
                Pay with Cash
              </Button>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={() => openCheckoutDialog("CARD")}
                disabled={loading}
                aria-label="Pay with card"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Pay with Card
              </Button>
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => setShowClearCartDialog(true)}
                disabled={loading}
                aria-label="Clear cart"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Cart
              </Button>
            </div>
          </div>
        )}
      </>
    )
  }
}

