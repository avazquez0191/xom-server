// services/export.service.ts
import { Response } from 'express';
import { OrderModel } from '@schemas/order.schema';
import { buildOrdersByBatchPipeline } from '@utils/pipelines.utils';
import { ExportFactory } from '@platforms/export.factory';
import archiver from 'archiver';
import { OrderBase } from '@models/order.model';

export class ExportService {
    static async streamShippingConfirmationExports(batchId: string, res: Response): Promise<void> {
        // Fetch confirmed orders
        const orders: OrderBase[] = await OrderModel.aggregate(
            buildOrdersByBatchPipeline(batchId, {
                confirmedOnly: true,
                disablePagination: true,
            })
        );

        if (!orders || orders.length === 0) {
            throw new Error('No confirmed orders found for this batch');
        }

        // Group by platform
        const grouped: Record<string, any[]> = {};
        for (const order of orders) {
            if (!grouped[order.metadata.platform]) {
                grouped[order.metadata.platform] = [];
            }
            grouped[order.metadata.platform].push(order);
        }

        // Create archive and pipe directly to response
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(res);

        // Append platform exports directly to archive
        for (const [platform, platformOrders] of Object.entries(grouped)) {
            const exporter = ExportFactory.getExporter(platform, 'shipping-confirmation');
            const stream = exporter.export(platformOrders);
            const extension = exporter.getFileExtension();
            const filename = `${platform}-shipping-confirmation.${extension}`;

            archive.append(stream, { name: filename });
        }

        // Finalize the archive (streams it to client)
        await archive.finalize();
    }
}
