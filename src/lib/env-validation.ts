/**
 * Environment Variable Validation
 *
 * Validates required environment variables on application startup
 * to prevent runtime errors due to missing configuration.
 */

interface EnvConfig {
  name: string
  required: boolean
  description: string
  validator?: (value: string) => boolean
  errorMessage?: string
}

const ENV_SCHEMA: EnvConfig[] = [
  // Database
  {
    name: "DATABASE_URL",
    required: true,
    description: "PostgreSQL connection string",
    validator: (val) => val.startsWith("postgresql://") || val.startsWith("postgres://"),
    errorMessage: "DATABASE_URL must be a valid PostgreSQL connection string"
  },

  // Authentication
  {
    name: "NEXTAUTH_SECRET",
    required: true,
    description: "NextAuth.js secret for JWT encryption",
    validator: (val) => val.length >= 32 && !val.includes("REPLACE") && !val.includes("your-super-secret-key"),
    errorMessage: "NEXTAUTH_SECRET must be at least 32 characters and not be a placeholder. Generate using: openssl rand -base64 32"
  },
  {
    name: "NEXTAUTH_URL",
    required: true,
    description: "Canonical URL of the application",
    validator: (val) => val.startsWith("http://") || val.startsWith("https://"),
    errorMessage: "NEXTAUTH_URL must be a valid URL"
  },

  // Optional but recommended
  {
    name: "STRIPE_SECRET_KEY",
    required: false,
    description: "Stripe secret key for payment processing"
  },
  {
    name: "RESEND_API_KEY",
    required: false,
    description: "Resend API key for email sending"
  },
  {
    name: "AWS_S3_BUCKET",
    required: false,
    description: "AWS S3 bucket for file storage"
  },
  {
    name: "SENTRY_DSN",
    required: false,
    description: "Sentry DSN for error tracking"
  }
]

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates all environment variables against the schema
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  for (const config of ENV_SCHEMA) {
    const value = process.env[config.name]

    // Check if required variable is missing
    if (config.required && !value) {
      errors.push(`❌ ${config.name} is required but not set. ${config.description}`)
      if (config.errorMessage) {
        errors.push(`   ${config.errorMessage}`)
      }
      continue
    }

    // Check if optional variable is missing
    if (!config.required && !value) {
      warnings.push(`⚠️  ${config.name} is not set. ${config.description} (Optional)`)
      continue
    }

    // Validate value if validator is provided
    if (value && config.validator && !config.validator(value)) {
      errors.push(`❌ ${config.name} is invalid. ${config.errorMessage || config.description}`)
    }
  }

  // Production-specific checks
  if (process.env.NODE_ENV === "production") {
    // Ensure NEXTAUTH_URL uses HTTPS in production
    const nextAuthUrl = process.env.NEXTAUTH_URL
    if (nextAuthUrl && !nextAuthUrl.startsWith("https://")) {
      errors.push("❌ NEXTAUTH_URL must use HTTPS in production")
    }

    // Warn about missing optional services in production
    if (!process.env.SENTRY_DSN) {
      warnings.push("⚠️  SENTRY_DSN not set - error tracking disabled in production")
    }

    if (!process.env.RESEND_API_KEY) {
      warnings.push("⚠️  RESEND_API_KEY not set - email functionality disabled")
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validates environment and exits process if critical errors found
 */
export function validateEnvironmentOrExit(): void {
  console.log("🔍 Validating environment variables...")

  const result = validateEnvironment()

  // Print warnings
  if (result.warnings.length > 0) {
    console.log("\n⚠️  Warnings:")
    result.warnings.forEach(warning => console.log(warning))
  }

  // Print errors and exit if invalid
  if (!result.valid) {
    console.error("\n❌ Environment validation failed:")
    result.errors.forEach(error => console.error(error))
    console.error("\n💡 See .env.example for configuration template")
    process.exit(1)
  }

  console.log("✅ Environment validation passed\n")
}

/**
 * Gets an environment variable with type safety
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name]
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is not set`)
  }
  return value || defaultValue!
}

/**
 * Gets a required environment variable (throws if not set)
 */
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  return value
}

/**
 * Checks if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

/**
 * Checks if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development"
}

/**
 * Checks if a feature flag is enabled
 */
export function isFeatureEnabled(featureName: string): boolean {
  const envVar = `FEATURE_${featureName.toUpperCase()}`
  return process.env[envVar] === "true"
}
