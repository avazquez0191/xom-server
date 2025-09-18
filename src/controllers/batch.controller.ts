import { Request, Response } from 'express';
import { BatchService } from '@services/batch.service';
import { parsePagination } from '@utils/pagination.utils';
import { ShippingLabelService } from '@services/shippingLabel.service';
import { Batch } from '@schemas/batch.schema';

export class BatchController {
  static async importOrders(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      const platforms = Array.isArray(req.body.platforms)
        ? req.body.platforms
        : [req.body.platforms].filter(Boolean);
      const orderReferenceStart = req.body.orderReferenceStart
        ? parseInt(req.body.orderReferenceStart, 10)
        : undefined;

      console.log('📤 Upload started - Files:', files.map(file => file.originalname));
      console.log('📤 Platforms:', platforms);

      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      if (!platforms || platforms.length === 0) {
        return res.status(400).json({ error: 'No platforms selected' });
      }
      if (files.length !== platforms.length) {
        return res.status(400).json({ message: 'Files and platforms mismatch' });
      }

      const filePlatformPairs = files.map((file, index) => ({
        file,
        platform: platforms[index],
      }));

      const result = await BatchService.processOrderUpload(filePlatformPairs, orderReferenceStart);
      console.log('✅ Files processed successfully:', result.orders.length, 'orders');

      // Auto Generate and save PDF
      const filename = await ShippingLabelService.generateAndSaveBulkLabels(result.orders);
      console.log('💾 PDF saved as:', filename);

      // Update batch with label file
      const batch: Batch = result.batch;
      if (batch) {
        batch.labelFile = filename;
        await batch.save();
      }

      res.json({
        status: true,
        message: 'Orders processed successfully',
        insertedCount: result.insertedCount,
        orders: result.orders,
        batch: result.batch
      });

    } catch (error) {
      console.error('❌ Upload failed:', error instanceof Error ? error.message : 'Unknown error');

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Upload failed',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined
        })
      });
    }
  };

  static async exportOrderLabels(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      ShippingLabelService.serveSavedLabel(filename, res);
    } catch (error) {
      res.status(500).json({ error: 'Download failed' });
    }
  };

  static async getOne(req: Request, res: Response) {
    try {
      const { batchId, orderId } = req.params;
      const order = await BatchService.getOrder(batchId, orderId);
      // if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });
      res.json({ status: true, data: order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: 'Failed to fetch order' });
    }
  };

  static async list(req: Request, res: Response) {
    try {
      const { startDate, endDate, platform } = req.query;
      const batches = await BatchService.listBatches({ startDate: startDate as string, endDate: endDate as string, platform: platform as string });
      res.json({ status: true, data: batches });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, error: 'Failed to list batches' });
    }
  }

  static async listByBatch(req: Request, res: Response) {
    try {
      const { batchId } = req.params;
      const { page, limit } = parsePagination(req.query);
      const result = await BatchService.listOrdersByBatch(batchId, page, limit);
      res.json({ status: true, ...result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: 'Failed to list orders for batch' });
    }
  }
}
