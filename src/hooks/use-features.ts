import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeature(featureKey: string): boolean {
  const { data } = useSWR(
    `/api/tenant/features/${featureKey}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  return data?.enabled ?? false
}

/**
 * Hook to get all tenant features
 */
export function useTenantFeatures() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/tenant/features',
    fetcher
  )

  return {
    features: data as Record<string, boolean> | undefined,
    isLoading,
    error,
    mutate,
  }
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

      // Revalidate features
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

      // Revalidate features
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
  const { data, error, isLoading } = useSWR('/api/features', fetcher)

  return {
    catalog: data,
    isLoading,
    error,
  }
}

/**
 * Hook to get business type templates
 */
export function useBusinessTypes() {
  const { data, error, isLoading } = useSWR('/api/business-types', fetcher)

  return {
    templates: data,
    isLoading,
    error,
  }
}
