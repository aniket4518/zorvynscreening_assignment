import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createRecordSchema,
  updateRecordSchema,
  filterRecordsSchema,
} from "../zod/record.schema.js";
import { idParamSchema } from "../zod/common.schema.js";
import {
  createRecordController,
  getRecordsController,
  getRecordController,
  updateRecordController,
  deleteRecordController,
} from "../controller/record.controller.js";

const router = Router();

// All routes require auth
router.use(authMiddleware);

router.post(
  "/",
  requireRole("ADMIN"),
  validate(createRecordSchema, "body"),
  createRecordController
);

router.get(
  "/",
  requireRole("ANALYST", "ADMIN"),
  validate(filterRecordsSchema, "query"),
  getRecordsController
);

router.get(
  "/:id",
  requireRole("ANALYST", "ADMIN"),
  validate(idParamSchema, "params"),
  getRecordController
);

router.patch(
  "/:id",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  validate(updateRecordSchema, "body"),
  updateRecordController
);

router.delete(
  "/:id",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  deleteRecordController
);

export default router;
