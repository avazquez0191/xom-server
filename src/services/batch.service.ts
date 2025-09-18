import { FilePlatformPair, ProcessOrderUploadResult } from '@models/common.model';
import { OrderBase } from '@models/order.model';
import { detectPlatform, getPlatformMapper } from '@platforms/resolver';
import { BatchRepository } from '@repositories/batch.repository';
import { BatchModel } from '@schemas/batch.schema';
import { OrderModel } from '@schemas/order.schema';
import { generateBatchId } from '@utils/common.utils';

export class BatchService {
  static async createBatch(platforms: string[], ordersData: any[]) {
    const batchInfo = generateBatchId();

    // Step 1: Create batch
    const batch = await BatchModel.create({ name: batchInfo.name, platforms, orders: [] });

    // Step 2: Insert orders referencing batch
    const orders = await OrderModel.insertMany(
      ordersData.map(o => ({ ...o, batch: batch._id }))
    );

    // Step 3: Update batch with inserted order IDs
    batch.orders = orders.map(o => o._id.toString());
    await batch.save();

    return { batch, orders };
  }

  static async processOrderUpload(pairs: FilePlatformPair[], orderReferenceStart?: number): Promise<ProcessOrderUploadResult> {
    try {
      let platforms: string[] = [];
      let allOrdersProcessed: OrderBase[] = [];

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
        platforms.push(platform);
        console.log('🏷️ Platform detected:', detectedPlatform);

        // 2. Get appropriate mapper
        const mapper = getPlatformMapper(detectedPlatform);
        if (!mapper) {
          throw new Error(`No mapper found for platform: ${detectedPlatform}`);
        }

        // 3. Process file with detected mapper
        const results: OrderBase[] = await mapper.process(file.buffer, allOrdersProcessed.length, orderReferenceStart);
        if (results.length === 0) {
          console.warn(`⚠️ No valid orders found in file: ${file.originalname}`);
          continue;
        }
        console.log(`✅ Mapper processed ${results.length} orders from ${file.originalname}`);

        allOrdersProcessed = allOrdersProcessed.concat(results);
      }

      const { batch, orders } = await BatchService.createBatch(platforms, allOrdersProcessed);

      return {
        success: true,
        insertedCount: allOrdersProcessed.length,
        orders: orders.map(o => o.toObject()),
        batch: batch
      };
    } catch (error) {
      console.error(
        '❌ Upload processing failed:',
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  };

  static async getOrder(batchId: string, orderId: string) {
    return BatchRepository.getOrderInBatch(batchId, orderId);
  }

  static async listBatches(filters: { startDate?: string, endDate?: string, platform?: string }) {
    // Add any business logic or validation here
    return BatchRepository.listBatches(filters);
  }

  static async listOrdersByBatch(batchId: string, page = 1, limit = 25) {
    return BatchRepository.getOrdersByBatch(batchId, page, limit);
  }
}
