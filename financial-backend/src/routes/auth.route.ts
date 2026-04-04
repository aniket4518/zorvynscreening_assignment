import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { registerSchema, loginSchema } from "../zod/auth.schema.js";
import {
  registerController,
  loginController,
  logoutController,
} from "../controller/auth.controller.js";

const router = Router();

router.post("/register", validate(registerSchema, "body"), registerController);
router.post("/login", validate(loginSchema, "body"), loginController);
router.post("/logout", logoutController);

export default router;
