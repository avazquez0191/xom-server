import { OrderModel } from '@schemas/order.schema';
import { OrderRepository } from '@repositories/order.repository';
import { detectPlatform, getPlatformMapper } from '@platforms/resolver';
import { generateBatchId } from '@utils/common.util';
import OrderBase from '@models/order.model';

interface FilePlatformPair {
    file: Express.Multer.File;
    platform: string;
}

export class OrderService {
    static async processOrderUpload(pairs: FilePlatformPair[]): Promise<{
        success: boolean;
        insertedCount: number;
        orders: OrderBase[];
    }> {
        try {
            let totalInserted = 0;
            let allOrders: OrderBase[] = [];
            const batch = generateBatchId();

            for (const { file, platform } of pairs) {
                console.log(`📁 Processing file: ${file.originalname} for platform: ${platform}`);

                if (!file || !file.buffer) {
                    throw new Error('No file uploaded');
                }

                // 1. Detect platform (fallback to provided)
                const detectedPlatform = detectPlatform(platform);
                if (!detectedPlatform) {
                    throw new Error(`Unsupported platform: ${platform}`);
                }
                console.log('🏷️ Platform detected:', detectedPlatform);

                // 2. Get appropriate mapper
                const mapper = getPlatformMapper(detectedPlatform);
                if (!mapper) {
                    throw new Error(`No mapper found for platform: ${detectedPlatform}`);
                }

                // 3. Process file with detected mapper
                const results: OrderBase[] = await mapper.process(file.buffer, batch);
                if (results.length === 0) {
                    console.warn(`⚠️ No valid orders found in file: ${file.originalname}`);
                    continue;
                }
                console.log(`✅ Mapper processed ${results.length} orders from ${file.originalname}`);

                // 4. Insert into MongoDB
                const insertedDocs = await OrderModel.insertMany(results, { ordered: false });
                console.log(`💾 Inserted ${insertedDocs.length} orders into database`);

                totalInserted += insertedDocs.length;
                allOrders = allOrders.concat(insertedDocs);
            }

            return {
                success: true,
                insertedCount: totalInserted,
                orders: allOrders,
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
