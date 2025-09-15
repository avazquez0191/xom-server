import { type Request, type Response } from 'express';
import { OrderService } from '@services/order.service';
import { ShippingLabelService } from '@services/shippingLabel.service';
import { parsePagination } from '@utils/pagination';

export class OrderController {
    static async importOrders(req: Request, res: Response) {
        try {
            const files = req.files as Express.Multer.File[];
            let platforms: string[] = req.body.platforms;
            // Normalize platforms to array (multer + formData sometimes sends as string if only one value)
            if (!Array.isArray(platforms)) {
                platforms = [platforms];
            }

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

            const result = await OrderService.processOrderUpload(filePlatformPairs);
            console.log('✅ Files processed successfully:', result.orders.length, 'orders');

            // Generate and save PDF
            const filename = await ShippingLabelService.generateAndSaveBulkLabels(result.orders);
            console.log('💾 PDF saved as:', filename);

            // Return download URL instead of streaming
            res.json({
                success: true,
                message: 'Orders processed successfully',
                insertedCount: result.insertedCount,
                orders: result.orders,
                downloadUrl: `/api/order/download/labels/${filename}`,
                // filename: filename
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

    // Download saved PDFs
    static async exportOrderLabels(req: Request, res: Response) {
        try {
            const { filename } = req.params;
            ShippingLabelService.serveSavedLabel(filename, res);
        } catch (error) {
            res.status(500).json({ error: 'Download failed' });
        }
    };

    static async listByBatch(req: Request, res: Response) {
        try {
            const { batchId } = req.params;
            const { page, limit } = parsePagination(req.query);
            const result = await OrderService.listOrdersByBatch(batchId, page, limit);
            res.json({ ok: true, ...result });
        } catch (err) {
            console.error(err);
            res.status(500).json({ ok: false, error: 'Failed to list orders for batch' });
        }
    }

    static async getOne(req: Request, res: Response) {
        try {
            const { batchId, orderId } = req.params;
            const order = await OrderService.getOrder(batchId, orderId);
            // if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });
            res.json({ ok: true, data: order });
        } catch (err) {
            console.error(err);
            res.status(500).json({ ok: false, error: 'Failed to fetch order' });
        }
    }
}