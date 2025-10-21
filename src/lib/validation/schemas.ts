/**
 * Validation Schemas using Zod
 *
 * Centralized validation schemas for all API inputs
 * Ensures type safety and input validation across the application
 */

import { z } from "zod"

// ========================================
// COMMON SCHEMAS
// ========================================

export const emailSchema = z.string().email("Invalid email address").toLowerCase()

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")

export const urlSchema = z.string().url("Invalid URL format")

export const positiveNumberSchema = z.number().positive("Must be a positive number")

export const nonNegativeNumberSchema = z.number().min(0, "Cannot be negative")

export const dateSchema = z.string().datetime("Invalid datetime format").or(z.date())

export const uuidSchema = z.string().uuid("Invalid UUID format")

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50), // Max 100 items per page
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

// ========================================
// USER & AUTHENTICATION
// ========================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
})

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  role: z.enum(["BUSINESS_ADMIN", "MANAGER", "CASHIER"]),
  isActive: z.boolean().default(true),
})

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["BUSINESS_ADMIN", "MANAGER", "CASHIER"]).optional(),
  isActive: z.boolean().optional(),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

// ========================================
// PRODUCT
// ========================================

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200, "Name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  price: positiveNumberSchema,
  cost: nonNegativeNumberSchema.optional(),
  categoryId: uuidSchema,
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  image: urlSchema.optional(),
  trackStock: z.boolean().default(false),
  stock: z.number().int().min(0).optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  unit: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  isFavorite: z.boolean().default(false),
})

export const updateProductSchema = createProductSchema.partial()

export const bulkUpdateStockSchema = z.object({
  updates: z.array(
    z.object({
      productId: uuidSchema,
      quantity: z.number().int(),
      type: z.enum(["ADD", "SUBTRACT", "SET"]),
      reason: z.string().max(500).optional(),
    })
  ).min(1, "At least one update is required"),
})

// ========================================
// CATEGORY
// ========================================

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Name too long"),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const updateCategorySchema = createCategorySchema.partial()

// ========================================
// CUSTOMER
// ========================================

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(200, "Name too long"),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: z.string().max(500).optional(),
  loyaltyPoints: z.number().int().min(0).default(0),
  notes: z.string().max(1000).optional(),
})

export const updateCustomerSchema = createCustomerSchema.partial()

// ========================================
// ORDER
// ========================================

export const orderItemSchema = z.object({
  productId: uuidSchema,
  quantity: z.number().int().positive("Quantity must be at least 1"),
  price: positiveNumberSchema,
  notes: z.string().max(500).optional(),
})

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
  customerId: uuidSchema.optional(),
  tableId: uuidSchema.optional(),
  orderNumber: z.string().max(50).optional(),
  discount: nonNegativeNumberSchema.default(0),
  discountId: uuidSchema.optional(),
  tax: nonNegativeNumberSchema.default(0),
  tip: nonNegativeNumberSchema.default(0),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.enum(["CASH", "CARD", "MOBILE", "OTHER"]).default("CASH"),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"]),
  notes: z.string().max(500).optional(),
})

// ========================================
// DISCOUNT
// ========================================

export const createDiscountSchema = z.object({
  name: z.string().min(1, "Discount name is required").max(100, "Name too long"),
  code: z.string().min(1).max(50).toUpperCase(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: positiveNumberSchema,
  minimumPurchase: nonNegativeNumberSchema.default(0),
  maxUses: z.number().int().positive().optional(),
  usesCount: z.number().int().min(0).default(0),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  isActive: z.boolean().default(true),
})
  .refine((data) => {
    if (data.type === "PERCENTAGE") {
      return data.value <= 100
    }
    return true
  }, {
    message: "Percentage discount cannot exceed 100%",
    path: ["value"],
  })
  .refine((data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate)
    }
    return true
  }, {
    message: "End date must be after start date",
    path: ["endDate"],
  })

export const updateDiscountSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(50).toUpperCase().optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
  value: positiveNumberSchema.optional(),
  minimumPurchase: z.number().min(0).default(0).optional(),
  maxUses: z.number().int().positive().optional(),
  usesCount: z.number().int().min(0).default(0).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  isActive: z.boolean().default(true).optional(),
})

// ========================================
// TABLE
// ========================================

export const createTableSchema = z.object({
  name: z.string().min(1, "Table name is required").max(100, "Name too long"),
  capacity: z.number().int().positive("Capacity must be at least 1"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"]).default("AVAILABLE"),
})

export const updateTableSchema = createTableSchema.partial()

// ========================================
// TENANT
// ========================================

export const createTenantSchema = z.object({
  name: z.string().min(1, "Business name is required").max(200, "Name too long"),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(50, "Subdomain too long")
    .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens")
    .toLowerCase(),
  email: emailSchema,
  phone: phoneSchema.optional(),
  address: z.string().max(500).optional(),
  businessType: z.enum(["COFFEE_SHOP", "RESTAURANT", "RETAIL", "BAR", "OTHER"]),
  subscriptionPlan: z.enum(["BASIC", "PRO", "ENTERPRISE"]),
})

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: z.string().max(500).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "TRIAL", "CANCELLED"]).optional(),
})

// ========================================
// SETTINGS
// ========================================

export const updateSettingsSchema = z.object({
  currency: z.string().length(3, "Currency must be 3-letter code (e.g., USD)").optional(),
  currencySymbol: z.string().max(5).optional(),
  timezone: z.string().max(50).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxName: z.string().max(100).optional(),
  receiptFooter: z.string().max(500).optional(),
  enableInventory: z.boolean().optional(),
  enableTables: z.boolean().optional(),
  enableKitchenDisplay: z.boolean().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
})

// ========================================
// EMPLOYEE
// ========================================

export const createEmployeeSchema = z.object({
  userId: uuidSchema,
  position: z.string().max(100).optional(),
  hourlyRate: positiveNumberSchema.optional(),
  hireDate: dateSchema,
  isActive: z.boolean().default(true),
})

export const updateEmployeeSchema = createEmployeeSchema.partial()

export const clockInOutSchema = z.object({
  clockIn: dateSchema.optional(),
  clockOut: dateSchema.optional(),
  notes: z.string().max(500).optional(),
})

// ========================================
// REPORTS
// ========================================

export const dateRangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
})
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  })

export const salesReportSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  groupBy: z.enum(["day", "week", "month", "product", "category", "employee"]).optional(),
})

// ========================================
// VALIDATION HELPER FUNCTIONS
// ========================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; errors: Record<string, string[]> } }

/**
 * Validates data against a Zod schema and returns a standardized result
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  // Format Zod errors into a more friendly structure
  const errors: Record<string, string[]> = {}
  result.error.errors.forEach((err) => {
    const path = err.path.join(".")
    if (!errors[path]) {
      errors[path] = []
    }
    errors[path].push(err.message)
  })

  return {
    success: false,
    error: {
      message: "Validation failed",
      errors,
    },
  }
}

/**
 * Validates query parameters with automatic type conversion
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  params: URLSearchParams
): ValidationResult<T> {
  const data: Record<string, unknown> = {}

  params.forEach((value, key) => {
    // Try to parse as number
    if (!isNaN(Number(value))) {
      data[key] = Number(value)
    }
    // Try to parse as boolean
    else if (value === "true" || value === "false") {
      data[key] = value === "true"
    }
    // Keep as string
    else {
      data[key] = value
    }
  })

  return validate(schema, data)
}
