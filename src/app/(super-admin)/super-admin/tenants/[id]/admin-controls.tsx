"use client"

import React from 'react'

export default function TenantAdminControls({
  tenantId,
  initialTenantStatus,
  initialPlan,
  initialSubStatus,
  initialTemplateId,
}: {
  tenantId: string
  initialTenantStatus: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'
  initialPlan: 'BASIC' | 'PRO' | 'ENTERPRISE'
  initialSubStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING'
  initialTemplateId?: string | null
}) {
  const [tenantStatus, setTenantStatus] = React.useState(initialTenantStatus)
  const [plan, setPlan] = React.useState(initialPlan)
  const [subStatus, setSubStatus] = React.useState(initialSubStatus)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [templates, setTemplates] = React.useState<any[]>([])
  const [templateId, setTemplateId] = React.useState<string | undefined>(initialTemplateId || undefined)

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/business-types')
        const data = await res.json()
        if (res.ok) setTemplates(data || [])
      } catch {}
    })()
  }, [])

  const updateTenantStatus = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: tenantStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update tenant status')
      setMessage('Tenant status updated')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSaving(false)
    }
  }

  const updateSubscription = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, status: subStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription')
      setMessage('Subscription updated')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSaving(false)
    }
  }

  const resetFeatures = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/features/reset`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to reset features')
      setMessage('Features reset to template defaults')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('features.updated'))
      }
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSaving(false)
    }
  }

  const applyTemplate = async () => {
    if (!templateId) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/template`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, initialize: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to apply template')
      setMessage('Template applied and features initialized')
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('features.updated'))
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Tenant Status</label>
        <select
          value={tenantStatus}
          onChange={(e) => setTenantStatus(e.target.value as any)}
          className="w-full border rounded px-2 py-2"
        >
          <option value="TRIAL">TRIAL</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <button className="mt-2 border rounded px-3 py-2" onClick={updateTenantStatus} disabled={saving}>Save Status</button>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Subscription Plan</label>
        <select value={plan} onChange={(e) => setPlan(e.target.value as any)} className="w-full border rounded px-2 py-2">
          <option value="BASIC">BASIC</option>
          <option value="PRO">PRO</option>
          <option value="ENTERPRISE">ENTERPRISE</option>
        </select>
        <label className="text-sm text-muted-foreground mt-2 block">Subscription Status</label>
        <select value={subStatus} onChange={(e) => setSubStatus(e.target.value as any)} className="w-full border rounded px-2 py-2">
          <option value="TRIALING">TRIALING</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="PAST_DUE">PAST_DUE</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <button className="mt-2 border rounded px-3 py-2" onClick={updateSubscription} disabled={saving}>Save Subscription</button>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Features</label>
        <button className="border rounded px-3 py-2" onClick={resetFeatures} disabled={saving}>Reset to Template Defaults</button>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Business Template</label>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="w-full border rounded px-2 py-2"
        >
          <option value="">Select a template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.displayName}</option>
          ))}
        </select>
        <button className="mt-2 border rounded px-3 py-2" onClick={applyTemplate} disabled={saving || !templateId}>Apply Template & Initialize</button>
        {templates.length === 0 && (
          <div className="mt-3">
            <button
              className="border rounded px-3 py-2"
              onClick={async () => {
                setSaving(true)
                setMessage(null)
                try {
                  const res = await fetch('/api/super-admin/seed-defaults', { method: 'POST' })
                  const data = await res.json().catch(() => ({}))
                  if (!res.ok) throw new Error(data.error || 'Failed to seed defaults')
                  // reload templates
                  const resp = await fetch('/api/business-types')
                  const list = await resp.json()
                  if (resp.ok) setTemplates(list || [])
                  setMessage('Default templates and features created')
                } catch (e: any) {
                  setMessage(e.message)
                } finally {
                  setSaving(false)
                }
              }}
            >
              Create Default Templates
            </button>
          </div>
        )}
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
