import prisma from "../config/prisma.js";

interface DateRange {
  startDate?: string;
  endDate?: string;
}

function buildDateFilter(dateRange?: DateRange) {
  if (!dateRange?.startDate && !dateRange?.endDate) return {};
  const filter: any = {};
  if (dateRange.startDate) filter.gte = new Date(dateRange.startDate);
  if (dateRange.endDate) filter.lte = new Date(dateRange.endDate);
  return { date: filter };
}

export async function getSummary(dateRange?: DateRange) {
  const dateFilter = buildDateFilter(dateRange);

  const [incomeResult, expenseResult, recordCount] = await Promise.all([
    prisma.financialRecord.aggregate({
      _sum: { amount: true },
      where: { type: "INCOME", isDeleted: false, ...dateFilter },
    }),
    prisma.financialRecord.aggregate({
      _sum: { amount: true },
      where: { type: "EXPENSE", isDeleted: false, ...dateFilter },
    }),
    prisma.financialRecord.count({
      where: { isDeleted: false, ...dateFilter },
    }),
  ]);

  const totalIncome = incomeResult._sum.amount || 0;
  const totalExpenses = expenseResult._sum.amount || 0;
  const netBalance = totalIncome - totalExpenses;

  return { totalIncome, totalExpenses, netBalance, recordCount };
}

export async function getCategoryTotals(
  type?: "INCOME" | "EXPENSE",
  dateRange?: DateRange
) {
  const dateFilter = buildDateFilter(dateRange);
  const where: any = { isDeleted: false, ...dateFilter };
  if (type) where.type = type;

  const grouped = await prisma.financialRecord.groupBy({
    by: ["categoryId"],
    _sum: { amount: true },
    where,
    orderBy: { _sum: { amount: "desc" } },
  });

  // Fetch category names
  const categoryIds = grouped.map((g) => g.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const grandTotal = grouped.reduce(
    (sum, g) => sum + (g._sum.amount || 0),
    0
  );

  return grouped.map((g) => {
    const total = g._sum.amount || 0;
    const category = categoryMap.get(g.categoryId);
    return {
      categoryId: g.categoryId,
      categoryName: category?.name || "Unknown",
      categoryType: category?.type || "EXPENSE",
      total,
      percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 10000) / 100 : 0,
    };
  });
}

export async function getTrends(
  period: "weekly" | "monthly" = "monthly",
  count: number = 12
) {
  // Calculate start date based on period and count
  const now = new Date();
  const startDate = new Date(now);

  if (period === "weekly") {
    startDate.setDate(startDate.getDate() - count * 7);
  } else {
    startDate.setMonth(startDate.getMonth() - count);
  }

  const records = await prisma.financialRecord.findMany({
    where: {
      isDeleted: false,
      date: { gte: startDate },
    },
    select: { amount: true, type: true, date: true },
    orderBy: { date: "asc" },
  });

  // Group records by period
  const periodMap = new Map<string, { income: number; expense: number }>();

  for (const record of records) {
    const date = new Date(record.date);
    let key: string;

    if (period === "weekly") {
      // Get ISO week
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      key = startOfWeek.toISOString().split("T")[0]!;
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    if (!periodMap.has(key)) {
      periodMap.set(key, { income: 0, expense: 0 });
    }

    const entry = periodMap.get(key)!;
    if (record.type === "INCOME") {
      entry.income += record.amount;
    } else {
      entry.expense += record.amount;
    }
  }

  // Convert to sorted array
  return Array.from(periodMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodKey, data]) => ({
      period: periodKey,
      income: Math.round(data.income * 100) / 100,
      expense: Math.round(data.expense * 100) / 100,
      net: Math.round((data.income - data.expense) * 100) / 100,
    }));
}

export async function getRecentActivity(limit: number = 10) {
  const records = await prisma.financialRecord.findMany({
    where: { isDeleted: false },
    include: {
      category: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { date: "desc" },
    take: limit,
  });

  return records;
}
