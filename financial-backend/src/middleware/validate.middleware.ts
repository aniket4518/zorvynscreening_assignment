import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export function validate(
  schema: ZodType<any>,
  source: "body" | "query" | "params" = "body"
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten(),
      });
      return;
    }

    // Replace with parsed/stripped data
    (req as any)[source] = result.data;
    next();
  };
}
