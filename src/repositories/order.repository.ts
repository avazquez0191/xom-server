import { OrderModel } from '@schemas/order.schema';
import { BatchAggregateResult, OrderAggregateResult } from '@models/aggregates.model';
import { buildListBatchesPipeline, buildOrderDetailsPipeline, buildOrdersByBatchPipeline } from '@utils/pipelines';

export class OrderRepository {
    static async listBatches(filters: { startDate?: string | Date, endDate?: string | Date, platform?: string }) {
        const pipeline = buildListBatchesPipeline(filters);
        return OrderModel.aggregate<BatchAggregateResult>(pipeline).exec();
    }

    static async getOrdersByBatch(batchId: string, page = 1, limit = 25) {
        const skip = (page - 1) * limit;
        const pipeline = buildOrdersByBatchPipeline(batchId, skip, limit);
        const [result] = await OrderModel.aggregate<BatchAggregateResult>(pipeline).exec();
        const total = (result && result.metadata && result.metadata[0]) ? result.metadata[0].total : 0;
        const data = (result && result.data) ? result.data : [];
        return { total, data, page, limit };
    }

    static async getOrderInBatch(batchId: string, orderId: string) {
        const pipeline = buildOrderDetailsPipeline(batchId, orderId);
        const [order] = await OrderModel.aggregate<OrderAggregateResult>(pipeline).exec();
        return order || null;
    }
}
