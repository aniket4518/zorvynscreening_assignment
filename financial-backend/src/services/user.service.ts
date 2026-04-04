import prisma from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { hashPassword } from "../utils/password.js";
import type { Role, UserStatus } from "../../generated/prisma/client.js";

const userSelectFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export async function createUser(
  adminId: number,
  data: {
    email: string;
    name: string;
    password: string;
    role: Role;
    status: UserStatus;
  },
) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });

  if (existing) {
    throw ApiError.conflict("Email already registered");
  }

  const hashedPassword = await hashPassword(data.password);

  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role,
        status: data.status,
      },
      select: userSelectFields,
    }),
    prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "CREATE_USER",
        entity: "User",
        details: JSON.stringify({
          createdEmail: data.email,
          role: data.role,
          status: data.status,
        }),
      },
    }),
  ]);

  return user;
}

export async function listUsers(cursor: number | undefined, limit: number) {
  const users = await prisma.user.findMany({
    select: userSelectFields,
    where: cursor ? { id: { lt: cursor } } : undefined,
    take: limit + 1,
    orderBy: { id: "desc" },
  });

  const hasNextPage = users.length > limit;
  const data = hasNextPage ? users.slice(0, limit) : users;
  const nextCursor = hasNextPage ? data[data.length - 1]?.id : null;

  return {
    users: data,
    nextCursor,
    limit,
  };
}

export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelectFields,
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return user;
}

export async function updateUser(
  id: number,
  data: { name?: string; email?: string },
) {
  await getUserById(id); // ensure exists

  const user = await prisma.user.update({
    where: { id },
    data,
    select: userSelectFields,
  });

  return user;
}

export async function deleteUser(adminId: number, id: number) {
  await getUserById(id); // ensure exists

  await prisma.$transaction([
    prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "DELETE_USER",
        entity: "User",
        entityId: id,
        details: JSON.stringify({ deletedUserId: id }),
      },
    }),
    prisma.user.delete({ where: { id } }),
  ]);
}

export async function assignUserRole(
  adminId: number,
  targetUserId: number,
  role: Role,
) {
  const user = await getUserById(targetUserId);
  const previousRole = user.role;

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role },
    select: userSelectFields,
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "UPDATE_ROLE",
      entity: "User",
      entityId: targetUserId,
      details: JSON.stringify({ previousRole, newRole: role }),
    },
  });

  return updated;
}

export async function toggleUserStatus(adminId: number, targetUserId: number) {
  const user = await getUserById(targetUserId);
  const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: newStatus },
    select: userSelectFields,
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "TOGGLE_STATUS",
      entity: "User",
      entityId: targetUserId,
      details: JSON.stringify({
        previousStatus: user.status,
        newStatus,
      }),
    },
  });

  return updated;
}
