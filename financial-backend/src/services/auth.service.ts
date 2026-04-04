import prisma from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { ApiError } from "../utils/api-error.js";
import type { RegisterInput, LoginInput } from "../zod/auth.schema.js";

export async function register(data: RegisterInput) {
  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw ApiError.conflict("Email already registered");
  }

  const hashedPwd = await hashPassword(data.password);

  // First user gets ADMIN role automatically
  const userCount = await prisma.user.count();
  const role = userCount === 0 ? "ADMIN" : "VIEWER";

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPwd,
      role,
    },
  });

  const token = generateToken({ userId: user.id, role: user.role });

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw ApiError.forbidden("Account is inactive. Contact an administrator.");
  }

  const isValid = await comparePassword(data.password, user.password);

  if (!isValid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = generateToken({ userId: user.id, role: user.role });

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}
