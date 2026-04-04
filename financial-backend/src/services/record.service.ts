import prisma from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import type { CreateRecordInput, FilterRecordsInput } from "../zod/record.schema.js";

export async function createRecord(userId: number, data: CreateRecordInput) {
  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    throw ApiError.badRequest("Invalid category ID");
  }

  const record = await prisma.financialRecord.create({
    data: {
      userId,
      categoryId: data.categoryId,
      amount: data.amount,
      type: data.type,
      date: new Date(data.date),
      notes: data.notes,
    },
    include: { category: true },
  });

  return record;
}

export async function getRecords(filters: FilterRecordsInput) {
  const { type, categoryId, startDate, endDate, search, page, limit } = filters;
  const skip = (page - 1) * limit;

  const where: any = { isDeleted: false };

  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  if (search) {
    where.notes = { contains: search, mode: "insensitive" };
  }

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      include: { category: true, user: { select: { id: true, name: true, email: true } } },
      skip,
      take: limit,
      orderBy: { date: "desc" },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return {
    records,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getRecordById(id: number) {
  const record = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
    include: { category: true, user: { select: { id: true, name: true, email: true } } },
  });

  if (!record) {
    throw ApiError.notFound("Financial record not found");
  }

  return record;
}

export async function updateRecord(
  id: number,
  data: Partial<CreateRecordInput>
) {
  await getRecordById(id); // ensure exists and not soft-deleted

  const updateData: any = { ...data };
  if (data.date) updateData.date = new Date(data.date);

  const record = await prisma.financialRecord.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });

  return record;
}

export async function softDeleteRecord(id: number) {
  await getRecordById(id); // ensure exists

  await prisma.financialRecord.update({
    where: { id },
    data: { isDeleted: true },
  });
}
