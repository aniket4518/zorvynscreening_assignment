import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  updateUserSchema,
  assignRoleSchema,
  createUserSchema,
} from "../zod/user.schema.js";
import { paginationSchema, idParamSchema } from "../zod/common.schema.js";
import {
  createUserController,
  listUsersController,
  getCurrentUserController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
  assignUserRoleController,
  toggleUserStatusController,
} from "../controller/user.controller.js";

const router = Router();

// All routes require auth
router.use(authMiddleware);

// Own profile — any role
router.get("/me", getCurrentUserController);

// Admin-only routes
router.post(
  "/",
  requireRole("ADMIN"),
  validate(createUserSchema, "body"),
  createUserController,
);

router.get(
  "/",
  requireRole("ADMIN"),
  validate(paginationSchema, "query"),
  listUsersController,
);

router.get(
  "/:id",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  getUserByIdController,
);

router.patch(
  "/:id",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  validate(updateUserSchema, "body"),
  updateUserController,
);

router.delete(
  "/:id",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  deleteUserController,
);

router.patch(
  "/:id/role",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  validate(assignRoleSchema, "body"),
  assignUserRoleController,
);

router.patch(
  "/:id/status",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  toggleUserStatusController,
);

export default router;
