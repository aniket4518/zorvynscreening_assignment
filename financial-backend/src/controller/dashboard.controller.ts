import type { Request, Response, NextFunction } from "express";
import * as dashboardService from "../services/dashboard.service.js";

export async function getSummaryController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };

    const dateRange =
      startDate || endDate ? { startDate, endDate } : undefined;
    const summary = await dashboardService.getSummary(dateRange);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryTotalsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { type, startDate, endDate } = req.query as {
      type?: "INCOME" | "EXPENSE";
      startDate?: string;
      endDate?: string;
    };

    const dateRange =
      startDate || endDate ? { startDate, endDate } : undefined;
    const totals = await dashboardService.getCategoryTotals(type, dateRange);
    res.status(200).json({ success: true, data: totals });
  } catch (error) {
    next(error);
  }
}

export async function getTrendsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const period = (req.query.period as "weekly" | "monthly") || "monthly";
    const count = Number(req.query.count) || 12;
    const trends = await dashboardService.getTrends(period, count);
    res.status(200).json({ success: true, data: trends });
  } catch (error) {
    next(error);
  }
}

export async function getRecentActivityController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = Number(req.query.limit) || 10;
    const records = await dashboardService.getRecentActivity(limit);
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
}
