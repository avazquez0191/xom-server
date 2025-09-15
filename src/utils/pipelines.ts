import { PipelineStage } from 'mongoose';

export function buildListBatchesPipeline(opts: {
    startDate?: string | Date;
    endDate?: string | Date;
    platform?: string;
}): PipelineStage[] {
    const match: any = {};
    if (opts.startDate || opts.endDate) match['metadata.purchaseDate'] = {};
    if (opts.startDate) match['metadata.purchaseDate'].$gte = new Date(opts.startDate as any);
    if (opts.endDate) match['metadata.purchaseDate'].$lte = new Date(opts.endDate as any);
    if (opts.platform) match['metadata.platform'] = opts.platform;

    return [
        { $match: Object.keys(match).length ? match : {} },
        {
            $group: {
                _id: "$batch.id",
                batchName: { $first: "$batch.name" },
                date: { $first: "$batch.uploadedAt" },
                orderIds: { $addToSet: "$orderId" },
                itemsCount: { $sum: "$product.quantityPurchased" },
                docsCount: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                batchId: "$_id",
                batchName: 1,
                date: 1,
                orderCount: { $size: "$orderIds" }
            }
        },
        { $sort: { date: -1 } }
    ];
}

export function buildOrdersByBatchPipeline(batchId: string, skip = 0, limit = 25): PipelineStage[] {
    return [
        { $match: { "batch.id": batchId } },
        {
            $group: {
                _id: "$orderId",
                orderId: { $first: "$orderId" },
                orderStatus: { $first: "$orderStatus" },
                recipient: { $first: "$recipient" },
                purchaseDate: { $first: "$metadata.purchaseDate" },
                platform: { $first: "$metadata.platform" },
                items: {
                    $push: {
                        sku: "$product.sku",
                        name: "$product.name",
                        variation: "$product.variation",
                        qty: "$product.quantityPurchased",
                        price: "$financial.basePrice",
                    }
                },
                totalQty: { $sum: "$product.quantityPurchased" },
                totalAmount: { $sum: "$financial.totalPrice" }
            }
        },
        { $sort: { purchaseDate: -1 } },
        {
            $facet: {
                metadata: [{ $count: "total" }],
                data: [{ $skip: skip }, { $limit: limit }]
            }
        }
    ];
}