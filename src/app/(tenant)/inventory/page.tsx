"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, AlertTriangle, Package } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ProductDialog } from "@/components/product-dialog"
import { TableLoadingSkeleton } from "@/components/loading-skeleton"
import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { ConfirmationDialog } from "@/components/confirmation-dialog"

interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost?: number
  category?: string
  categoryId?: string
  sku?: string
  barcode?: string
  stock: number
  trackStock: boolean
  lowStockAlert?: number
  isActive: boolean
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{open: boolean, product: Product | null}>({
    open: false,
    product: null
  })
  const { toast } = useToast()

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/products?all=true")
      if (!response.ok) {
        throw new Error("Failed to fetch products from server")
      }
      const data = await response.json()
      setProducts(data.products || [])
      setFilteredProducts(data.products || [])
    } catch (error: any) {
      setError(error.message || "Unable to load products. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredProducts(filtered)
  }, [searchQuery, products])

  const lowStockProducts = products.filter(
    (p) => p.trackStock && p.lowStockAlert && p.stock <= p.lowStockAlert
  )

  const handleAddProduct = () => {
    setSelectedProduct(undefined)
    setShowDialog(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowDialog(true)
  }

  const handleDeleteProduct = async () => {
    if (!deleteConfirm.product) return

    try {
      const response = await fetch(`/api/products/${deleteConfirm.product.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete product")
      }

      toast({
        title: "Product deleted",
        description: `${deleteConfirm.product.name} has been removed from your inventory.`,
      })

      setDeleteConfirm({open: false, product: null})
      loadProducts()
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Unable to delete product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (product: Product) => {
    setDeleteConfirm({open: true, product})
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your products and stock levels
          </p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <span className="font-medium">{product.name}</span>
                  <Badge variant="destructive">
                    Only {product.stock} left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or barcode..."
                  className="pl-10"
                  disabled
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TableLoadingSkeleton rows={5} />
          </CardContent>
        </Card>
      ) : error ? (
        <ErrorState message={error} onRetry={loadProducts} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products in inventory"
          description="Get started by adding your first product. Click the button below to create a new product entry."
          actionLabel="Add First Product"
          onAction={handleAddProduct}
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or barcode..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search products"
                />
              </div>
            </div>
            {filteredProducts.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            )}
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No products found"
                description={`No products match your search "${searchQuery}". Try a different search term or clear the search to see all products.`}
                actionLabel="Clear Search"
                onAction={() => setSearchQuery("")}
              />
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Product</th>
                        <th className="text-left py-3 px-4">Category</th>
                        <th className="text-left py-3 px-4">SKU/Barcode</th>
                        <th className="text-right py-3 px-4">Price</th>
                        <th className="text-right py-3 px-4">Cost</th>
                        <th className="text-right py-3 px-4">Stock</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-right py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.description && (
                                <p className="text-sm text-muted-foreground truncate max-w-xs">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{product.category || "Uncategorized"}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {product.sku && <div>SKU: {product.sku}</div>}
                              {product.barcode && (
                                <div className="text-muted-foreground">
                                  {product.barcode}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-medium">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="text-right py-3 px-4">
                            {product.cost !== null && product.cost !== undefined
                              ? `$${product.cost.toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="text-right py-3 px-4">
                            {product.trackStock ? (
                              <Badge
                                variant={
                                  product.lowStockAlert && product.stock <= product.lowStockAlert
                                    ? "destructive"
                                    : "default"
                                }
                              >
                                {product.stock}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="text-right py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditProduct(product)}
                                aria-label={`Edit ${product.name}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDeleteDialog(product)}
                                aria-label={`Delete ${product.name}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredProducts.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold">{product.name}</h3>
                            {product.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>
                          <Badge variant={product.isActive ? "default" : "secondary"}>
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Price:</span>
                            <p className="font-medium">${product.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Stock:</span>
                            <p className="font-medium">
                              {product.trackStock ? (
                                <Badge
                                  variant={
                                    product.lowStockAlert && product.stock <= product.lowStockAlert
                                      ? "destructive"
                                      : "default"
                                  }
                                >
                                  {product.stock}
                                </Badge>
                              ) : (
                                "N/A"
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Category:</span>
                            <p className="font-medium">{product.category || "Uncategorized"}</p>
                          </div>
                          {product.sku && (
                            <div>
                              <span className="text-muted-foreground">SKU:</span>
                              <p className="font-medium">{product.sku}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteDialog(product)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <ProductDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={loadProducts}
        product={selectedProduct}
      />

      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({open, product: null})}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteConfirm.product?.name}"? This action cannot be undone and will remove the product from your inventory permanently.`}
        confirmLabel="Delete Product"
        cancelLabel="Cancel"
        onConfirm={handleDeleteProduct}
        variant="destructive"
      />
    </div>
  )
}
