import { z } from "zod";

export const createRecordSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.number().int().positive("Category ID must be a positive integer"),
  date: z.string().datetime("Date must be a valid ISO datetime string"),
  notes: z.string().max(500, "Notes must be at most 500 characters").optional(),
});

export const updateRecordSchema = z
  .object({
    amount: z.number().positive("Amount must be a positive number").optional(),
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    categoryId: z.number().int().positive("Category ID must be a positive integer").optional(),
    date: z.string().datetime("Date must be a valid ISO datetime string").optional(),
    notes: z.string().max(500, "Notes must be at most 500 characters").optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: "At least one field must be provided" }
  );

export const filterRecordsSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type FilterRecordsInput = z.infer<typeof filterRecordsSchema>;
