'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useFeatureCatalog, useTenantFeatures, useToggleFeature } from '@/hooks/use-features'
import { Loader2, AlertCircle, CheckCircle2, Crown } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export const dynamic = 'force-dynamic'

export default function FeaturesPage() {
  const { catalog, isLoading: catalogLoading } = useFeatureCatalog()
  const { features, isLoading: featuresLoading, mutate } = useTenantFeatures()
  const { toggle, resetToDefaults } = useToggleFeature()
  const { toast } = useToast()
  const [resetting, setResetting] = useState(false)

  const handleToggle = async (featureKey: string, enabled: boolean) => {
    const result = await toggle(featureKey, enabled)
    if (result.success) {
      toast({
        title: enabled ? 'Feature Enabled' : 'Feature Disabled',
        description: `Feature has been ${enabled ? 'enabled' : 'disabled'} successfully.`,
      })
      mutate()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to toggle feature',
        variant: 'destructive',
      })
    }
  }

  const handleReset = async () => {
    setResetting(true)
    const result = await resetToDefaults()
    if (result.success) {
      toast({
        title: 'Features Reset',
        description: 'All features have been reset to template defaults.',
      })
      mutate()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to reset features',
        variant: 'destructive',
      })
    }
    setResetting(false)
  }

  if (catalogLoading || featuresLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Feature Management</h1>
        <p className="text-muted-foreground">
          Enable or disable features based on your business needs
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Feature Configuration</AlertTitle>
        <AlertDescription>
          Some features may require a higher subscription plan. Core features cannot be disabled.
          Features with dependencies must have their required features enabled first.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Reset to Defaults</CardTitle>
          <CardDescription>
            Restore the recommended feature configuration for your business type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetting}
          >
            {resetting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset to Template Defaults'
            )}
          </Button>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="space-y-4">
        {catalog && Object.entries(catalog).map(([category, categoryFeatures]) => (
          <AccordionItem key={category} value={category} className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{category.replace(/_/g, ' ')}</h3>
                <Badge variant="secondary">{(categoryFeatures as any[]).length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                {(categoryFeatures as any[]).map((feature) => (
                  <FeatureRow
                    key={feature.id}
                    feature={feature}
                    enabled={features?.[feature.featureKey] ?? false}
                    onToggle={(enabled) => handleToggle(feature.featureKey, enabled)}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

function FeatureRow({
  feature,
  enabled,
  onToggle,
}: {
  feature: any
  enabled: boolean
  onToggle: (enabled: boolean) => void
}) {
  const isDisabled = feature.isCore

  return (
    <div className="flex items-start justify-between py-3 border-b last:border-0">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{feature.name}</h4>
          {feature.isCore && (
            <Badge variant="default" className="text-xs">
              Core
            </Badge>
          )}
          {feature.isBeta && (
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
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
          <p className="text-xs text-muted-foreground">
            Requires: {feature.dependsOn.join(', ')}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
        {enabled && !isDisabled && (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        )}
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={isDisabled}
        />
      </div>
    </div>
  )
}
