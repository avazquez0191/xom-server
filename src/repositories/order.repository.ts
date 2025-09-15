import { OrderModel } from '@schemas/order.schema';
import { BatchAggregateResult, OrderAggregateResult } from '@models/aggregates.model';
import { buildListBatchesPipeline, buildOrdersByBatchPipeline } from '@utils/pipelines';

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
        const pipeline = [
            { $match: { batchId, orderId } },
            {
                $group: {
                    _id: "$orderId",
                    orderId: { $first: "$orderId" },
                    buyerName: { $first: "$buyerName" },
                    buyerEmail: { $first: "$buyerEmail" },
                    purchaseDate: { $first: "$purchaseDate" },
                    items: {
                        $push: {
                            sku: "$sku",
                            productName: "$productName",
                            qty: "$quantityPurchased",
                            price: "$price",
                            currency: "$currency",
                            meta: "$meta"
                        }
                    },
                    totalQty: { $sum: "$quantityPurchased" },
                    totalAmount: { $sum: { $multiply: [{ $ifNull: ["$quantityPurchased", 0] }, { $ifNull: ["$price", 0] }] } }
                }
            }
        ];
        const [order] = await OrderModel.aggregate<OrderAggregateResult>(pipeline).exec();
        return order || null;
    }
}
