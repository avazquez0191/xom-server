import { Request, Response } from 'express';
import { BatchService } from '@services/batch.service';

export class BatchController {
  static async list(req: Request, res: Response) {
    try {
      const { startDate, endDate, platform } = req.query;
      const batches = await BatchService.listBatches({ startDate: startDate as string, endDate: endDate as string, platform: platform as string });
      res.json({ ok: true, data: batches });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, error: 'Failed to list batches' });
    }
  }
}
