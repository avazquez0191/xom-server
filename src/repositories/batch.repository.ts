import { BatchModel } from '@schemas/batch.schema';
import { BatchAggregateResult, OrderAggregateResult } from '@models/aggregates.model';
import { buildListBatchesPipeline, buildOrderDetailsPipeline, buildOrdersByBatchPipeline } from '@utils/pipelines.utils';
import { OrderModel } from '@schemas/order.schema';
import { ListOptions } from '@models/common.model';

export class BatchRepository {
    static async getBatch(batchId: string) {
        return BatchModel.findById(batchId).exec();
    }

    static async listBatches(filters: { startDate?: string | Date, endDate?: string | Date, platform?: string }) {
        const pipeline = buildListBatchesPipeline(filters);
        return BatchModel.aggregate<BatchAggregateResult>(pipeline).exec();
    }

    static async getOrdersByBatch(batchId: string, { page = 1, limit = 25, disablePagination = false }: ListOptions = {}) {
        if (disablePagination) {
            const pipeline = buildOrdersByBatchPipeline(batchId, { disablePagination: true });
            const data = await OrderModel.aggregate<OrderAggregateResult>(pipeline).exec();
            return { total: data.length, data, page: 1, limit: data.length };
        }
        const skip = (page - 1) * limit;
        const pipeline = buildOrdersByBatchPipeline(batchId, { skip, limit });
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
