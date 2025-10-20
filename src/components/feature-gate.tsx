'use client'

import { useFeature } from '@/hooks/use-features'
import { ReactNode } from 'react'

interface FeatureGateProps {
  feature: string
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Component that conditionally renders children based on feature flag
 */
export function FeatureGate({ feature, fallback = null, children }: FeatureGateProps) {
  const isEnabled = useFeature(feature)

  if (!isEnabled) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Higher-order component to wrap components with feature gate
 */
export function withFeatureGate<P extends object>(
  Component: React.ComponentType<P>,
  featureKey: string,
  fallback?: ReactNode
) {
  return function FeatureGatedComponent(props: P) {
    return (
      <FeatureGate feature={featureKey} fallback={fallback}>
        <Component {...props} />
      </FeatureGate>
    )
  }
}
