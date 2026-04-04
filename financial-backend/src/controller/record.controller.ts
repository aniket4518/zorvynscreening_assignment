import type { Request, Response, NextFunction } from "express";
import * as recordService from "../services/record.service.js";

export async function createFinancialRecordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await recordService.createFinancialRecord(
      req.userId,
      req.body,
    );
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

export async function listFinancialRecordsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await recordService.listFinancialRecords(req.query as any);
    res.status(200).json({
      success: true,
      data: result.records,
      meta: {
        limit: result.limit,
        nextCursor: result.nextCursor,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getFinancialRecordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const record = await recordService.getFinancialRecordById(id);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

export async function updateFinancialRecordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const record = await recordService.updateFinancialRecord(id, req.body);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

export async function deleteFinancialRecordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    await recordService.deleteFinancialRecord(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
