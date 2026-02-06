import { z } from "zod";
import { Request, Response, NextFunction } from "express";

// === Category keys (must match CATEGORY_DEFINITIONS in items.ts) ===
export const CATEGORY_KEYS = [
  "Liquidi",
  "Banca",
  "Credito",
  "Investimenti",
  "Portafoglio",
  "Debito",
  "Finanziamento",
  "Condivise",
] as const;

// === Auth Schemas ===

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "Password too long"),
});

export const requestResetSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  token: z.string().min(1, "Token is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "Password too long"),
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name too long"),
  photoURL: z.string().max(3_000_000, "Photo too large").optional().default(""),
});

// === Schemas ===

export const createSnapshotSchema = z.object({
  date: z.string().min(1, "Date is required"),
  frequency: z.enum(["monthly", "weekly"], {
    errorMap: () => ({ message: "Frequency must be 'monthly' or 'weekly'" }),
  }),
  totalValue: z.number({ required_error: "totalValue is required" }),
  entries: z
    .array(
      z.object({
        itemId: z.string().min(1, "itemId is required"),
        value: z.number({ required_error: "value is required" }),
        encryptedData: z.string().optional(),
      }),
    )
    .min(1, "At least one entry is required"),
  encryptedData: z.string().optional(),
});

export const updateSnapshotSchema = z.object({
  date: z.string().optional(),
  frequency: z.enum(["monthly", "weekly"]).optional(),
  totalValue: z.number().optional(),
  entries: z
    .array(
      z.object({
        itemId: z.string().min(1),
        value: z.number(),
      }),
    )
    .min(1)
    .optional(),
});

export const createItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category name too long"),
  sortOrder: z.number().optional(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(50).optional(),
  sortOrder: z.number().optional(),
});

export const reorderSchema = z.array(
  z.object({
    id: z.string().min(1, "Item id is required"),
    sortOrder: z.number(),
  }),
);

export const createMilestoneSchema = z.object({
  date: z.string().min(1, "Date is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().default(""),
  eventType: z.enum(
    ["job_change", "purchase", "investment", "debt_paid", "other"],
    { errorMap: () => ({ message: "Invalid event type" }) },
  ),
  icon: z.string().optional().nullable(),
});

export const updateMilestoneSchema = z.object({
  date: z.string().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  eventType: z
    .enum(["job_change", "purchase", "investment", "debt_paid", "other"])
    .optional(),
  icon: z.string().optional().nullable(),
});

// === Validation middleware ===

export const createCategoryDefinitionSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  categoryType: z.string().min(1, "Category type is required").max(50),
  sortOrder: z.number().optional(),
});

export const updateCategoryDefinitionSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  categoryType: z.string().min(1).max(50).optional(),
  sortOrder: z.number().optional(),
});

export const bulkCategoryDefinitionsSchema = z.array(
  z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required").max(50),
    categoryType: z.string().min(1).max(50),
    sortOrder: z.number(),
  }),
);

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }
    req.body = result.data;
    next();
  };
}
