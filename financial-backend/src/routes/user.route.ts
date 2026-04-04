import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateUserSchema, assignRoleSchema } from "../zod/user.schema.js";
import { paginationSchema, idParamSchema } from "../zod/common.schema.js";
import {
  getUsersController,
  getOwnProfileController,
  getUserController,
  updateUserController,
  deleteUserController,
  assignRoleController,
  toggleStatusController,
} from "../controller/user.controller.js";

const router = Router();

// All routes require auth
router.use(authMiddleware);

// Own profile — any role
router.get("/me", getOwnProfileController);

// Admin-only routes
router.get(
  "/",
  requireRole("ADMIN"),
  validate(paginationSchema, "query"),
  getUsersController
);

router.get(
  "/:id",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  getUserController
);

router.patch(
  "/:id",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  validate(updateUserSchema, "body"),
  updateUserController
);

router.delete(
  "/:id",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  deleteUserController
);

router.patch(
  "/:id/role",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  validate(assignRoleSchema, "body"),
  assignRoleController
);

router.patch(
  "/:id/status",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  toggleStatusController
);

export default router;
