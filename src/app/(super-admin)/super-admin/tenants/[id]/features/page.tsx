'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Loader2, Crown } from 'lucide-react'

export default function SuperAdminTenantFeaturesPage({ params }: { params: { id: string } }) {
  const tenantId = params.id
  const router = useRouter()
  const [catalog, setCatalog] = useState<Record<string, any[]> | null>(null)
  const [features, setFeatures] = useState<Record<string, boolean> | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [catRes, featRes] = await Promise.all([
        fetch('/api/features', { cache: 'no-store' }),
        fetch(`/api/super-admin/tenants/${tenantId}/features`, { cache: 'no-store' }),
      ])
      const cat = await catRes.json()
      const feat = await featRes.json()
      if (!catRes.ok) throw new Error(cat.error || 'Failed to fetch catalog')
      if (!featRes.ok) throw new Error(feat.error || 'Failed to fetch features')
      setCatalog(cat)
      setFeatures(feat)
    } catch (e: any) {
      setError(e.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onToggle = async (featureKey: string, enable: boolean) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: enable ? 'enable' : 'disable', featureKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to toggle feature')
      setFeatures((prev) => ({ ...(prev || {}), [featureKey]: enable }))
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('features.updated'))
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const onReset = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset features')
      await load()
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('features.updated'))
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert className="max-w-2xl">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>Back</Button>
          <Button onClick={load}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Tenant Features</h1>
          <p className="text-muted-foreground">Toggle features for this tenant</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/super-admin/tenants/${tenantId}`}>
            <Button variant="outline">Back to Tenant</Button>
          </Link>
          <Button onClick={onReset} disabled={actionLoading} variant="outline">
            {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Reset to Defaults
          </Button>
        </div>
      </div>

      <Alert className="mb-6 max-w-3xl">
        <AlertTitle>About Feature Access</AlertTitle>
        <AlertDescription>
          Premium features require the tenant subscription to meet the minimum plan. Dependencies must be enabled first.
        </AlertDescription>
      </Alert>

      <Accordion type="multiple" className="space-y-4">
        {catalog && Object.entries(catalog).map(([category, items]: [string, any[]]) => (
          <AccordionItem key={category} value={category} className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{category.replace(/_/g, ' ')}</h3>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                {items.map((feature) => (
                  <div key={feature.id} className="flex items-start justify-between py-3 border-b last:border-0">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{feature.name}</h4>
                        {feature.isCore && (
                          <Badge variant="default" className="text-xs">Core</Badge>
                        )}
                        {feature.isBeta && (
                          <Badge variant="secondary" className="text-xs">Beta</Badge>
                        )}
                        {feature.requiresUpgrade && (
                          <Badge variant="default" className="text-xs bg-amber-500">
                            <Crown className="w-3 h-3 mr-1" />
                            {feature.minimumPlan}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                      {feature.dependsOn && feature.dependsOn.length > 0 && (
                        <p className="text-xs text-muted-foreground">Requires: {feature.dependsOn.join(', ')}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={!!features?.[feature.featureKey]}
                        onCheckedChange={(v) => onToggle(feature.featureKey, v)}
                        disabled={actionLoading || feature.isCore}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

