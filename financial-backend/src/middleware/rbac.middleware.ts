import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api-error.js";

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      next(ApiError.unauthorized("Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      next(ApiError.forbidden("Forbidden: insufficient permissions"));
      return;
    }

    next();
  };
}
