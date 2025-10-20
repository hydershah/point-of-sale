import { useEffect, useState } from 'react'

function jsonFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  return fetch(url, { cache: 'no-store', ...init }).then(async (res) => {
    const data = await res.json().catch(() => undefined)
    if (!res.ok) {
      const message = (data && (data.error || data.message)) || 'Request failed'
      throw new Error(message)
    }
    return data as T
  })
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeature(featureKey: string): boolean {
  const [enabled, setEnabled] = useState<boolean>(false)

  const load = async () => {
    try {
      const data = await jsonFetch<{ enabled: boolean }>(`/api/tenant/features/${featureKey}`)
      setEnabled(!!data.enabled)
    } catch {
      setEnabled(false)
    }
  }

  useEffect(() => {
    load()
    const handler = () => load()
    if (typeof window !== 'undefined') {
      window.addEventListener('features.updated', handler as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('features.updated', handler as EventListener)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureKey])

  return enabled
}

/**
 * Hook to get all tenant features
 */
export function useTenantFeatures() {
  const [features, setFeatures] = useState<Record<string, boolean> | undefined>()
  const [isLoading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | undefined>()

  const load = async () => {
    setLoading(true)
    setError(undefined)
    try {
      const data = await jsonFetch<Record<string, boolean>>('/api/tenant/features')
      setFeatures(data)
    } catch (e: any) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const handler = () => load()
    if (typeof window !== 'undefined') {
      window.addEventListener('features.updated', handler as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('features.updated', handler as EventListener)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { features, isLoading, error, mutate: load }
}

/**
 * Hook to toggle features
 */
export function useToggleFeature() {
  const { mutate } = useTenantFeatures()

  const toggle = async (featureKey: string, enable: boolean) => {
    try {
      const response = await fetch('/api/tenant/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: enable ? 'enable' : 'disable',
          featureKey,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to toggle feature')
      }

      // Notify listeners and revalidate features
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('features.updated'))
      }
      mutate()

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  const resetToDefaults = async () => {
    try {
      const response = await fetch('/api/tenant/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reset features')
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('features.updated'))
      }
      mutate()

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  return { toggle, resetToDefaults }
}

/**
 * Hook to get feature catalog
 */
export function useFeatureCatalog() {
  const [catalog, setCatalog] = useState<any>()
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(undefined)
      try {
        const data = await jsonFetch<any>('/api/features')
        if (!cancelled) setCatalog(data)
      } catch (e: any) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { catalog, isLoading, error }
}

/**
 * Hook to get business type templates
 */
export function useBusinessTypes() {
  const [templates, setTemplates] = useState<any>()
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>()

  const load = async () => {
    setLoading(true)
    setError(undefined)
    try {
      const data = await jsonFetch<any>('/api/business-types')
      setTemplates(data)
    } catch (e: any) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!cancelled) await load()
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { templates, isLoading, error, mutate: load }
}
