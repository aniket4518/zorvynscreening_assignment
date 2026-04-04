import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import {
  getSummaryController,
  getCategoryTotalsController,
  getTrendsController,
  getRecentActivityController,
} from "../controller/dashboard.controller.js";

const router = Router();

// All routes require auth
router.use(authMiddleware);

router.get(
  "/summary",
  requireRole("VIEWER", "ANALYST", "ADMIN"),
  getSummaryController
);

router.get(
  "/categories",
  requireRole("VIEWER", "ANALYST", "ADMIN"),
  getCategoryTotalsController
);

router.get(
  "/trends",
  requireRole("ANALYST", "ADMIN"),
  getTrendsController
);

router.get(
  "/recent",
  requireRole("VIEWER", "ANALYST", "ADMIN"),
  getRecentActivityController
);

export default router;
