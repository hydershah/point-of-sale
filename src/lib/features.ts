import { prisma } from '@/lib/prisma'
import { SubscriptionPlan } from '@prisma/client'

/**
 * Check if a feature is enabled for a tenant
 */
export async function isFeatureEnabled(
  tenantId: string,
  featureKey: string
): Promise<boolean> {
  // Get feature from catalog
  const feature = await prisma.feature_catalog.findUnique({
    where: { featureKey },
  })

  if (!feature) {
    console.warn(`Feature not found: ${featureKey}`)
    return false
  }

  // Check tenant_features table
  const tenantFeature = await prisma.tenant_features.findUnique({
    where: {
      tenantId_featureId: {
        tenantId,
        featureId: feature.id,
      },
    },
  })

  return tenantFeature?.isEnabled ?? false
}

/**
 * Check if tenant can access a feature (subscription check)
 */
export async function checkFeatureAccess(
  tenantId: string,
  featureKey: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Get tenant with subscription
  const tenant = await prisma.tenants.findUnique({
    where: { id: tenantId },
    include: { subscriptions: true },
  })

  if (!tenant) {
    return { allowed: false, reason: 'Tenant not found' }
  }

  // Get feature from catalog
  const feature = await prisma.feature_catalog.findUnique({
    where: { featureKey },
    select: {
      id: true,
      name: true,
      minimumPlan: true,
      dependsOn: true,
      requiresUpgrade: true,
    },
  })

  if (!feature) {
    return { allowed: false, reason: 'Feature not found' }
  }

  // Check subscription plan requirement
  if (feature.minimumPlan && tenant.subscriptions) {
    const planHierarchy: SubscriptionPlan[] = ['BASIC', 'PRO', 'ENTERPRISE']
    const requiredPlanIndex = planHierarchy.indexOf(feature.minimumPlan)
    const currentPlanIndex = planHierarchy.indexOf(tenant.subscriptions.plan)

    if (currentPlanIndex < requiredPlanIndex) {
      return {
        allowed: false,
        reason: `Requires ${feature.minimumPlan} plan or higher`,
      }
    }
  }

  // Check feature dependencies
  if (feature.dependsOn && Array.isArray(feature.dependsOn)) {
    for (const depKey of feature.dependsOn as string[]) {
      const depEnabled = await isFeatureEnabled(tenantId, depKey)
      if (!depEnabled) {
        const depFeature = await prisma.feature_catalog.findUnique({
          where: { featureKey: depKey },
        })
        return {
          allowed: false,
          reason: `Requires "${depFeature?.name || depKey}" to be enabled first`,
        }
      }
    }
  }

  return { allowed: true }
}

/**
 * Get all enabled features for a tenant
 */
export async function getTenantFeatures(
  tenantId: string
): Promise<Record<string, boolean>> {
  const tenantFeatures = await prisma.tenant_features.findMany({
    where: { tenantId },
    include: {
      feature: {
        select: {
          featureKey: true,
        },
      },
    },
  })

  const featureMap: Record<string, boolean> = {}
  for (const tf of tenantFeatures) {
    featureMap[tf.feature.featureKey] = tf.isEnabled
  }

  return featureMap
}

/**
 * Enable a feature for a tenant
 */
export async function enableFeature(
  tenantId: string,
  featureKey: string,
  enabledBy?: string
): Promise<{ success: boolean; error?: string }> {
  // Check if tenant can access this feature
  const access = await checkFeatureAccess(tenantId, featureKey)
  if (!access.allowed) {
    return { success: false, error: access.reason }
  }

  // Get feature
  const feature = await prisma.feature_catalog.findUnique({
    where: { featureKey },
  })

  if (!feature) {
    return { success: false, error: 'Feature not found' }
  }

  // Enable feature
  await prisma.tenant_features.upsert({
    where: {
      tenantId_featureId: {
        tenantId,
        featureId: feature.id,
      },
    },
    update: {
      isEnabled: true,
      enabledAt: new Date(),
      enabledBy,
      disabledAt: null,
      disabledBy: null,
      updatedAt: new Date(),
    },
    create: {
      id: require('nanoid').nanoid(),
      tenantId,
      featureId: feature.id,
      isEnabled: true,
      enabledAt: new Date(),
      enabledBy,
      updatedAt: new Date(),
    },
  })

  return { success: true }
}

/**
 * Disable a feature for a tenant
 */
export async function disableFeature(
  tenantId: string,
  featureKey: string,
  disabledBy?: string
): Promise<{ success: boolean; error?: string }> {
  // Get feature
  const feature = await prisma.feature_catalog.findUnique({
    where: { featureKey },
  })

  if (!feature) {
    return { success: false, error: 'Feature not found' }
  }

  // Check if this is a required feature for the business template
  const tenant = await prisma.tenants.findUnique({
    where: { id: tenantId },
    select: { businessTemplateId: true },
  })

  if (tenant?.businessTemplateId) {
    const templateFeature = await prisma.template_features.findUnique({
      where: {
        templateId_featureId: {
          templateId: tenant.businessTemplateId,
          featureId: feature.id,
        },
      },
    })

    if (templateFeature?.isRequired) {
      return {
        success: false,
        error: 'This feature is required and cannot be disabled',
      }
    }
  }

  // Disable feature
  await prisma.tenant_features.upsert({
    where: {
      tenantId_featureId: {
        tenantId,
        featureId: feature.id,
      },
    },
    update: {
      isEnabled: false,
      disabledAt: new Date(),
      disabledBy,
      updatedAt: new Date(),
    },
    create: {
      id: require('nanoid').nanoid(),
      tenantId,
      featureId: feature.id,
      isEnabled: false,
      disabledAt: new Date(),
      disabledBy,
      updatedAt: new Date(),
    },
  })

  return { success: true }
}

/**
 * Reset tenant features to template defaults
 */
export async function resetToTemplateDefaults(
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const tenant = await prisma.tenants.findUnique({
    where: { id: tenantId },
    include: {
      business_template: {
        include: {
          template_features: {
            include: {
              feature: true,
            },
          },
        },
      },
    },
  })

  if (!tenant) {
    return { success: false, error: 'Tenant not found' }
  }

  if (!tenant.business_template) {
    return { success: false, error: 'No business template assigned' }
  }

  // Delete all existing tenant features
  await prisma.tenant_features.deleteMany({
    where: { tenantId },
  })

  // Create new features based on template
  for (const tf of tenant.business_template.template_features) {
    await prisma.tenant_features.create({
      data: {
        id: require('nanoid').nanoid(),
        tenantId,
        featureId: tf.featureId,
        isEnabled: tf.isEnabledByDefault,
        enabledAt: tf.isEnabledByDefault ? new Date() : null,
        updatedAt: new Date(),
      },
    })
  }

  return { success: true }
}

/**
 * Initialize features for a new tenant based on business template
 */
export async function initializeTenantFeatures(
  tenantId: string,
  templateId: string
): Promise<void> {
  const templateFeatures = await prisma.template_features.findMany({
    where: { templateId },
  })

  for (const tf of templateFeatures) {
    await prisma.tenant_features.create({
      data: {
        id: require('nanoid').nanoid(),
        tenantId,
        featureId: tf.featureId,
        isEnabled: tf.isEnabledByDefault,
        enabledAt: tf.isEnabledByDefault ? new Date() : null,
        updatedAt: new Date(),
      },
    })
  }
}

/**
 * Get feature catalog with category grouping
 */
export async function getFeatureCatalog() {
  const features = await prisma.feature_catalog.findMany({
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  })

  // Group by category
  const grouped = features.reduce((acc, feature) => {
    const category = feature.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(feature)
    return acc
  }, {} as Record<string, typeof features>)

  return grouped
}

/**
 * Get all business type templates
 */
export async function getBusinessTypeTemplates(includeInactive = false) {
  return prisma.business_type_templates.findMany({
    where: includeInactive ? undefined : { isActive: true },
    include: {
      template_features: {
        include: {
          feature: true,
        },
      },
    },
    orderBy: [{ isPopular: 'desc' }, { sortOrder: 'asc' }],
  })
}

/**
 * Get single business type template
 */
export async function getBusinessTypeTemplate(typeKey: string) {
  return prisma.business_type_templates.findUnique({
    where: { typeKey },
    include: {
      template_features: {
        include: {
          feature: true,
        },
      },
    },
  })
}
