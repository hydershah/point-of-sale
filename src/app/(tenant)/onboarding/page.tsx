'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBusinessTypes } from '@/hooks/use-features'
import { Loader2, Check, ArrowRight, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const { templates, isLoading } = useBusinessTypes()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const router = useRouter()

  const handleContinue = () => {
    if (selectedTemplate) {
      // In a real implementation, this would save the template selection
      // and initialize tenant features
      router.push('/dashboard')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Group templates by category
  const groupedTemplates = templates?.reduce((acc: any, template: any) => {
    const category = template.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(template)
    return acc
  }, {})

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Welcome to Your POS System</h1>
        <p className="text-xl text-muted-foreground">
          Let&apos;s customize the system for your business
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">What type of business do you run?</h2>
        <p className="text-muted-foreground">
          Choose the option that best describes your business. We&apos;ll configure the perfect set of features for you.
        </p>
      </div>

      {/* Popular Templates */}
      {templates?.some((t: any) => t.isPopular) && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h3 className="text-lg font-semibold">Popular Choices</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates
              ?.filter((t: any) => t.isPopular)
              .map((template: any) => (
                <BusinessTypeCard
                  key={template.id}
                  template={template}
                  selected={selectedTemplate === template.id}
                  onSelect={() => setSelectedTemplate(template.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* All Templates by Category */}
      {groupedTemplates && Object.entries(groupedTemplates).map(([category, categoryTemplates]: [string, any]) => (
        <div key={category} className="mb-8">
          <h3 className="text-lg font-semibold mb-4">{category.replace(/_/g, ' ')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTemplates.map((template: any) => (
              <BusinessTypeCard
                key={template.id}
                template={template}
                selected={selectedTemplate === template.id}
                onSelect={() => setSelectedTemplate(template.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Continue Button */}
      {selectedTemplate && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
          <div className="container mx-auto max-w-6xl flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Template Selected</p>
              <p className="font-semibold">
                {templates?.find((t: any) => t.id === selectedTemplate)?.displayName}
              </p>
            </div>
            <Button onClick={handleContinue} size="lg">
              Continue
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function BusinessTypeCard({
  template,
  selected,
  onSelect,
}: {
  template: any
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{template.displayName}</CardTitle>
            <CardDescription className="mt-1">{template.subcategory}</CardDescription>
          </div>
          {selected && (
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{template.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {template.hasDineIn && <Badge variant="secondary">Dine-In</Badge>}
          {template.hasTakeaway && <Badge variant="secondary">Takeaway</Badge>}
          {template.hasDelivery && <Badge variant="secondary">Delivery</Badge>}
          {template.hasKitchen && <Badge variant="secondary">Kitchen</Badge>}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Recommended Plan</span>
            <Badge variant="outline" className="text-xs">
              {template.recommendedPlan}
            </Badge>
          </div>
          {template.expectedDailyOrders && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Expected Orders/Day</span>
              <span className="font-medium">{template.expectedDailyOrders}</span>
            </div>
          )}
          {template.typicalOrderTime && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Typical Order Time</span>
              <span className="font-medium">{template.typicalOrderTime} min</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
