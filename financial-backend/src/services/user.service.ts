import prisma from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import type { Role } from "../../generated/prisma/client.js";

const userSelectFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export async function getAllUsers(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: userSelectFields,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
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
  data: { name?: string; email?: string }
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

export async function assignRole(
  adminId: number,
  targetUserId: number,
  role: Role
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

export async function toggleStatus(adminId: number, targetUserId: number) {
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
