import type { Request, Response, NextFunction } from "express";
import * as recordService from "../services/record.service.js";

export async function createRecordController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const record = await recordService.createRecord(req.userId, req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

export async function getRecordsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await recordService.getRecords(req.query as any);
    res.status(200).json({
      success: true,
      data: result.records,
      meta: {
        page: result.page,
        limit: Number(req.query.limit) || 20,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecordController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const record = await recordService.getRecordById(id);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

export async function updateRecordController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const record = await recordService.updateRecord(id, req.body);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

export async function deleteRecordController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    await recordService.softDeleteRecord(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
