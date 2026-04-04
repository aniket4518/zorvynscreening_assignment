import type { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service.js";

export async function createUserController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.createUser(req.userId, req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function listUsersController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
    const limit = Number(req.query.limit) || 20;
    const result = await userService.listUsers(cursor, limit);
    res.status(200).json({
      success: true,
      data: result.users,
      meta: {
        limit: result.limit,
        nextCursor: result.nextCursor,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUserController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.getUserById(req.userId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function getUserByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
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
  next: NextFunction,
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
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    await userService.deleteUser(req.userId, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function assignUserRoleController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const { role } = req.body;
    const user = await userService.assignUserRole(req.userId, id, role);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function toggleUserStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const user = await userService.toggleUserStatus(req.userId, id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}
