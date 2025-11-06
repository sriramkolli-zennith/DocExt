import { z } from "zod"

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Extract schemas
export const extractionNameSchema = z.object({
  documentName: z.string()
    .min(1, "Please enter a document name")
    .min(3, "Document name must be at least 3 characters")
    .max(100, "Document name must be less than 100 characters"),
})

export const fieldExtractionSchema = z.object({
  name: z.string()
    .min(1, "Field name is required")
    .min(2, "Field name must be at least 2 characters")
    .max(50, "Field name must be less than 50 characters"),
  type: z.enum(["text", "number", "date", "email", "phone", "currency", "boolean"]),
})

export const extractionFormSchema = z.object({
  documentName: z.string().min(1, "Document name is required"),
  files: z.array(z.instanceof(File)).min(1, "At least one file is required"),
  fields: z.array(fieldExtractionSchema).min(1, "At least one field is required"),
})

// Profile schemas
export const profileUpdateSchema = z.object({
  fullName: z.string().max(100, "Full name must be less than 100 characters").optional(),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .optional(),
})

// Type exports for use in components
export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ExtractionNameFormData = z.infer<typeof extractionNameSchema>
export type FieldExtractionFormData = z.infer<typeof fieldExtractionSchema>
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
