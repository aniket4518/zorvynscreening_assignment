import prisma from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import type {
  CreateRecordInput,
  FilterRecordsInput,
} from "../zod/record.schema.js";

export async function createFinancialRecord(
  userId: number,
  data: CreateRecordInput,
) {
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

export async function listFinancialRecords(filters: FilterRecordsInput) {
  const { type, categoryId, startDate, endDate, search, cursor, limit } =
    filters;

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

  if (cursor) {
    where.id = { lt: cursor };
  }

  const records = await prisma.financialRecord.findMany({
    where,
    include: {
      category: true,
      user: { select: { id: true, name: true, email: true } },
    },
    take: limit + 1,
    orderBy: { id: "desc" },
  });

  const hasNextPage = records.length > limit;
  const data = hasNextPage ? records.slice(0, limit) : records;
  const nextCursor = hasNextPage ? data[data.length - 1]?.id : null;

  return {
    records: data,
    nextCursor,
    limit,
  };
}

export async function getFinancialRecordById(id: number) {
  const record = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
    include: {
      category: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!record) {
    throw ApiError.notFound("Financial record not found");
  }

  return record;
}

export async function updateFinancialRecord(
  id: number,
  data: Partial<CreateRecordInput>,
) {
  await getFinancialRecordById(id); // ensure exists and not soft-deleted

  const updateData: any = { ...data };
  if (data.date) updateData.date = new Date(data.date);

  const record = await prisma.financialRecord.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });

  return record;
}

export async function deleteFinancialRecord(id: number) {
  await getFinancialRecordById(id); // ensure exists

  await prisma.financialRecord.update({
    where: { id },
    data: { isDeleted: true },
  });
}
