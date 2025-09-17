import { PipelineStage } from 'mongoose';

export function buildListBatchesPipeline(opts: {
    startDate?: string | Date;
    endDate?: string | Date;
    platform?: string;
}): PipelineStage[] {
    const match: any = {};

    if (opts.startDate || opts.endDate) match["metadata.purchaseDate"] = {};
    if (opts.startDate) match["metadata.purchaseDate"].$gte = new Date(opts.startDate as any);
    if (opts.endDate) match["metadata.purchaseDate"].$lte = new Date(opts.endDate as any);

    if (opts.platform) match["metadata.platform"] = opts.platform;

    return [
        { $match: Object.keys(match).length ? match : {} },
        {
            $group: {
                _id: "$batch.id",
                batchName: { $first: "$batch.name" },
                date: { $first: "$batch.uploadedAt" },
                orderIds: { $addToSet: "$orderId" },
                platforms: { $addToSet: "$metadata.platform" },
                docsCount: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                batchId: "$_id",
                batchName: 1,
                date: 1,
                orderCount: { $size: "$orderIds" },
                platforms: 1
            }
        },
        { $sort: { date: -1 } }
    ];
}

export function buildOrdersByBatchPipeline(batchId: string, skip = 0, limit = 25): PipelineStage[] {
    return [
        { $match: { "batch.id": batchId } },
        { $sort: { orderIndex: 1 } },
        {
            $facet: {
                metadata: [{ $count: "total" }],
                data: [{ $skip: skip }, { $limit: limit }]
            }
        }
    ];
}

export function buildOrderDetailsPipeline(batchId: string, orderId: string): PipelineStage[] {
    return [
        { $match: { "batch.id": batchId, orderId } }
    ]
}