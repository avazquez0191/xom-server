import { Types } from 'mongoose';
import { FilePlatformPair, ListOptions, ProcessOrderUploadResult, ShippingConfirmation } from '@models/common.model';
import { OrderBase } from '@models/order.model';
import { detectPlatform, getPlatformMapper } from '@platforms/mapper.factory';
import { BatchRepository } from '@repositories/batch.repository';
import { BatchModel } from '@schemas/batch.schema';
import { IOrder, OrderModel } from '@schemas/order.schema';
import { validatePackageAllocation } from '@utils/packageValidator';

export class BatchService {
  static async createBatch(platforms: string[], ordersData: any[]) {
    //get minimum and maximum orderReferenceNumber
    const orderReferenceNumbers = ordersData.map(o => o.orderReferenceNumber).filter(n => n != null) as number[];
    const minOrderReferenceNumber = Math.min(...orderReferenceNumbers);
    const maxOrderReferenceNumber = Math.max(...orderReferenceNumbers);
    let batchName = minOrderReferenceNumber === maxOrderReferenceNumber ?
      minOrderReferenceNumber : `${minOrderReferenceNumber}-${maxOrderReferenceNumber}`;
    // Fallback if orderReferenceNumber is not valid
    if (!isFinite(minOrderReferenceNumber) || !isFinite(maxOrderReferenceNumber)) {
      batchName = `Batch`; // fallback name
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

  static async getBatch(batchId: string) {
    return BatchRepository.getBatch(batchId);
  }

  static async getOrder(batchId: string, orderId: string) {
    return BatchRepository.getOrderInBatch(batchId, orderId);
  }

  static async listBatches(filters: { startDate?: string, endDate?: string, platform?: string }) {
    // Add any business logic or validation here
    return BatchRepository.listBatches(filters);
  }

  static async listOrdersByBatch(batchId: string, opt: ListOptions = {}) {
    return BatchRepository.getOrdersByBatch(batchId, opt);
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

    // Fetch orders first so we preserve existing products inside packages
    const orderIds = confirmations.map(c => c.orderId);
    const orders = await OrderModel.find({
      batch: new Types.ObjectId(batchId),
      orderId: { $in: orderIds }
    }).lean<IOrder[]>();

    const bulkOps = confirmations.map(conf => {
      const order = orders.find(o => o.orderId === conf.orderId);
      if (!order) return null;

      // Build new packages array
      const updatedPackages = conf.trackingNumbers.map((tn, index) => ({
        label: {
          trackingNumber: tn,
          carrier,
          serviceType: service,
          cost: conf.cost,
        },
        // preserve products if exist, otherwise empty
        products: order.shipping?.packages?.[index]?.products ?? []
      }));

      return {
        updateOne: {
          filter: { batch: new Types.ObjectId(batchId), orderId: conf.orderId },
          update: { $set: { 'shipping.packages': updatedPackages } },
        },
      };
    }).filter((op): op is NonNullable<typeof op> => op !== null);

    if (bulkOps.length === 0) {
      return { modifiedCount: 0 };
    }

    const result = await OrderModel.bulkWrite(bulkOps, { ordered: false });
    return { modifiedCount: result.modifiedCount };
  }

  static async assignPackages(batchId: string, orderId: string, packages: any[]) {
    const order = await OrderModel.findOne({ batch: batchId, orderId });
    if (!order) throw new Error(`Order ${orderId} not found in batch ${batchId}`);

    // validate allocations
    validatePackageAllocation(order.products, packages);

    // update shipping.packages
    order.shipping.packages = packages;
    await order.save();

    return order.toObject<IOrder>();
  }

  static async assignPackagesForBatch(batchId: string, orders: { orderId: string; packages: any[] }[]) {
    const updatedOrders: IOrder[] = [];
    for (const o of orders) {
      const updatedOrder = await this.assignPackages(batchId, o.orderId, o.packages);
      updatedOrders.push(updatedOrder);
    }
    return updatedOrders;
  }
}
