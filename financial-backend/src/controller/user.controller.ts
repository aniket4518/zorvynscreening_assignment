import type { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service.js";

export async function getUsersController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await userService.getAllUsers(page, limit);
    res.status(200).json({ success: true, data: result.users, meta: { page: result.page, limit, total: result.total, totalPages: result.totalPages } });
  } catch (error) {
    next(error);
  }
}

export async function getOwnProfileController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await userService.getUserById(req.userId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function getUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const user = await userService.getUserById(id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const user = await userService.updateUser(id, req.body);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    await userService.deleteUser(req.userId, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function assignRoleController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const { role } = req.body;
    const user = await userService.assignRole(req.userId, id, role);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function toggleStatusController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const user = await userService.toggleStatus(req.userId, id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}
