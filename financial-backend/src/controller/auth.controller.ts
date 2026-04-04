import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  _req: Request,
  res: Response
): Promise<void> {
  // Stateless JWT — logout is handled client-side by discarding the token
  res.status(200).json({ success: true, message: "Logged out successfully" });
}
