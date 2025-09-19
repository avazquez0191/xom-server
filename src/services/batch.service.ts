import { Types } from 'mongoose';
import { FilePlatformPair, ProcessOrderUploadResult } from '@models/common.model';
import { OrderBase } from '@models/order.model';
import { detectPlatform, getPlatformMapper } from '@platforms/resolver';
import { BatchRepository } from '@repositories/batch.repository';
import { BatchModel } from '@schemas/batch.schema';
import { OrderModel } from '@schemas/order.schema';
import { generateBatchId } from '@utils/common.utils';

interface ShippingConfirmation {
  orderId: string;
  trackingNumbers: string[];
  cost: number;
}

export class BatchService {
  static async createBatch(platforms: string[], ordersData: any[]) {
    //get minimum and maximum orderReferenceNumber
    const orderReferenceNumbers = ordersData.map(o => o.orderReferenceNumber).filter(n => n != null) as number[];
    const minOrderReferenceNumber = Math.min(...orderReferenceNumbers);
    const maxOrderReferenceNumber = Math.max(...orderReferenceNumbers);
    let batchName = `Batch ${minOrderReferenceNumber}-${maxOrderReferenceNumber}`;
    if (!isFinite(minOrderReferenceNumber) || !isFinite(maxOrderReferenceNumber)) {
      batchName = `Batch 1-${ordersData.length}}`; // fallback name
    }
    
    // Step 1: Create batch
    const batch = await BatchModel.create({ name: batchName, platforms, orders: [] });

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

  static async applyShippingConfirmations(
    batchId: string,
    confirmations: ShippingConfirmation[],
    carrier?: string,
    service?: string
  ) {
    if (!Types.ObjectId.isValid(batchId)) {
      throw new Error('Invalid batchId');
    }

    const bulkOps = confirmations.map((conf) => ({
      updateOne: {
        filter: { batch: new Types.ObjectId(batchId), orderId: conf.orderId },
        update: {
          $set: {
            'orderStatus': 'SHIPPED',
            'shipping.labels': conf.trackingNumbers.map(tn => ({
              trackingNumber: tn,
              carrier: carrier,
              serviceType: service,
              cost: conf.cost,
            }))
          },
        },
      },
    }));

    if (bulkOps.length === 0) {
      return { modifiedCount: 0 };
    }

    const result = await OrderModel.bulkWrite(bulkOps, { ordered: false });
    return { modifiedCount: result.modifiedCount };
  }
}
