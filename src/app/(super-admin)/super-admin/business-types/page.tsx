'use client'

import { useState } from 'react'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBusinessTypes } from '@/hooks/use-features'
import { Loader2, Plus, Edit, Eye } from 'lucide-react'

export default function SuperAdminBusinessTypesPage() {
  const { templates, isLoading, mutate } = useBusinessTypes()
  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Business Type Templates</h1>
          <p className="text-muted-foreground">
            Manage business type templates and their default features
          </p>
        </div>
        <Button>
          <Plus className="mr-2 w-4 h-4" />
          Create New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {templates?.map((template: any) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{template.displayName}</CardTitle>
                    {template.isPopular && (
                      <Badge variant="default" className="bg-amber-500">
                        Popular
                      </Badge>
                    )}
                    {!template.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Category</div>
                  <div className="font-medium">{template.category}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Subcategory</div>
                  <div className="font-medium">{template.subcategory || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Recommended Plan</div>
                  <Badge variant="outline">{template.recommendedPlan}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Features</div>
                  <div className="font-medium">{template.template_features?.length || 0}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {template.hasDineIn && <Badge variant="secondary">Dine-In</Badge>}
                {template.hasTakeaway && <Badge variant="secondary">Takeaway</Badge>}
                {template.hasDelivery && <Badge variant="secondary">Delivery</Badge>}
                {template.hasKitchen && <Badge variant="secondary">Kitchen</Badge>}
                {template.requiresTable && <Badge variant="secondary">Tables Required</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!templates || templates.length === 0) && (
        <Card>
          <CardContent className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">No business type templates found</p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={async () => {
                  setSeeding(true)
                  setMessage(null)
                  try {
                    const res = await fetch('/api/super-admin/seed-defaults', { method: 'POST' })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) throw new Error(data.error || 'Failed to seed defaults')
                    setMessage('Default templates and features created')
                    await mutate()
                  } catch (e: any) {
                    setMessage(e.message)
                  } finally {
                    setSeeding(false)
                  }
                }}
                disabled={seeding}
              >
                {seeding ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Seeding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 w-4 h-4" /> Create Default Templates
                  </>
                )}
              </Button>
            </div>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
