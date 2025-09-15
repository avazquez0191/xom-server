import { OrderModel } from '@schemas/order.schema';
import { OrderRepository } from '@repositories/order.repository';
import { detectPlatform, getPlatformMapper } from '@platforms/resolver';
import { generateBatchId } from '@utils/common.util';
import OrderBase from '@models/order.model';

export class OrderService {
    static processOrderUpload = async (
        fileBuffer: Buffer,
        filePlatform: string
    ): Promise<{
        success: boolean;
        insertedCount: number;
        orders: OrderBase[];
    }> => {
        if (!fileBuffer) throw new Error('No file uploaded');

        try {
            // 1. Detect platform
            const platform = detectPlatform(filePlatform);
            if (!platform) {
                throw new Error('Unsupported platform');
            }
            console.log('🏷️ Platform detected:', platform);

            // 2. Get appropriate mapper
            const mapper = getPlatformMapper(platform);
            if (!mapper) {
                throw new Error(`No mapper found for platform: ${platform}`);
            }

            // 3. Process file with detected mapper
            const batch = generateBatchId();
            const results: OrderBase[] = await mapper.process(fileBuffer, batch);
            if (results.length === 0) {
                throw new Error('No valid orders found in the file');
            }
            console.log('✅ Mapper processed', results.length, 'orders');

            // 4. Insert into MongoDB (Mongoose way)
            const insertedDocs = await OrderModel.insertMany(results, { ordered: false });
            console.log('💾 Inserted', insertedDocs.length, 'orders into database');

            return {
                success: true,
                insertedCount: insertedDocs.length,
                orders: insertedDocs,
            };
        } catch (error) {
            console.error(
                '❌ Upload processing failed:',
                error instanceof Error ? error.message : error
            );
            throw error;
        }
    };

    static async listOrdersByBatch(batchId: string, page = 1, limit = 25) {
        return OrderRepository.getOrdersByBatch(batchId, page, limit);
    }

    static async getOrder(batchId: string, orderId: string) {
        return OrderRepository.getOrderInBatch(batchId, orderId);
    }
}
