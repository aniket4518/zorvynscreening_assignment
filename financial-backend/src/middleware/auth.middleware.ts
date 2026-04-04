import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { ApiError } from "../utils/api-error.js";
import prisma from "../config/prisma.js";

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      userId: number;
      userRole: string;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw ApiError.unauthorized("Token not provided");
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, status: true },
    });

    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    if (user.status !== "ACTIVE") {
      throw ApiError.forbidden("Account is inactive");
    }

    req.userId = user.id;
    req.userRole = user.role;

    next();
  } catch (error: any) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (error.name === "TokenExpiredError") {
      next(ApiError.unauthorized("Token has expired"));
      return;
    }

    if (error.name === "JsonWebTokenError") {
      next(ApiError.unauthorized("Invalid token"));
      return;
    }

    next(ApiError.unauthorized("Authentication failed"));
  }
}
