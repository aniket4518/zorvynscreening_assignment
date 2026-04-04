import { z } from "zod";

export const assignRoleSchema = z.object({
  role: z.enum(["VIEWER", "ANALYST", "ADMIN"]),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email address").optional(),
  })
  .refine((data) => data.name || data.email, {
    message: "At least one field (name or email) must be provided",
  });

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
