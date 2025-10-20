"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit, Save, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmationDialog } from "@/components/confirmation-dialog"

interface Category {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  _count?: { products: number }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (e) {
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" })
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const addCategory = async () => {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create category")
      setNewName("")
      toast({ title: "Category created" })
      load()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (c: Category) => {
    setEditingId(c.id)
    setEditName(c.name)
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      const res = await fetch(`/api/categories/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update category")
      toast({ title: "Category updated" })
      setEditingId(null)
      setEditName("")
      load()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const requestDelete = (c: Category) => setDeleteTarget(c)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to delete category")
      toast({ title: "Category deleted" })
      setDeleteTarget(null)
      load()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Organize your menu and inventory</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Category name (e.g., Beverages)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
            <Button onClick={addCategory} disabled={adding || !newName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  {editingId === c.id ? (
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-60" />
                  ) : (
                    <span className="font-medium">{c.name}</span>
                  )}
                  {typeof c._count?.products === "number" && (
                    <Badge variant="secondary">{c._count.products} products</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingId === c.id ? (
                    <>
                      <Button size="sm" variant="outline" onClick={saveEdit}>
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => requestDelete(c)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="text-center text-muted-foreground py-6">No categories yet</div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete category?"
        description={
          deleteTarget?._count?.products
            ? `"${deleteTarget.name}" has ${deleteTarget._count.products} products. Reassign or remove them first.`
            : `This will permanently delete "${deleteTarget?.name}".`
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  )
}

