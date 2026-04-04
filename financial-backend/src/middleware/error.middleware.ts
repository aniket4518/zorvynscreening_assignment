import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api-error.js";

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle our custom ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Handle Prisma known errors
  if ((err as any).code === "P2002") {
    res.status(409).json({
      success: false,
      message: "A record with this value already exists",
      code: "CONFLICT",
    });
    return;
  }

  if ((err as any).code === "P2025") {
    res.status(404).json({
      success: false,
      message: "Record not found",
      code: "NOT_FOUND",
    });
    return;
  }

  // Log unexpected errors
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
