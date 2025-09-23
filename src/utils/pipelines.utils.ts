import { PipelineStage, Types } from 'mongoose';

export function buildListBatchesPipeline(opts: {
    startDate?: string | Date;
    endDate?: string | Date;
    platform?: string;
}): PipelineStage[] {
    const match: any = {};

    if (opts.startDate || opts.endDate) match["createdAt"] = {};
    if (opts.startDate) match["createdAt"].$gte = new Date(opts.startDate as any);
    if (opts.endDate) match["createdAt"].$lte = new Date(opts.endDate as any);

    // if (opts.platform) match["metadata.platform"] = opts.platform;

    return [
        { $match: Object.keys(match).length ? match : {} },
        {
            $project: {
                id: "$_id", // map _id to id
                name: 1,
                createdAt: 1,
                orderCount: { $size: "$orders" },
                platforms: 1,
                labelFile: 1,
                _id: 0 // exclude _id
            }
        },
        { $sort: { createdAt: -1 } }
    ];
}

export function buildOrdersByBatchPipeline(
    batchId: string,
    { skip = 0, limit = 25, confirmedOnly = false, disablePagination = false }:
        { skip?: number; limit?: number; confirmedOnly?: boolean; disablePagination?: boolean }
): PipelineStage[] {

    const match: any = { batch: new Types.ObjectId(batchId) };

    if (confirmedOnly) {
        match["orderStatus"] = "SHIPPED";
    }

    const baseStages: PipelineStage[] = [
        { $match: Object.keys(match).length ? match : {} },
        { $sort: { orderIndex: 1 } },
    ];

    if (disablePagination) {
        return [
            ...baseStages
        ];
    }

    return [
        ...baseStages,
        {
            $facet: {
                metadata: [{ $count: "total" }],
                data: [{ $skip: skip }, { $limit: limit }],
            },
        },
    ];
}

export function buildOrderDetailsPipeline(batchId: string, orderId: string): PipelineStage[] {
    return [
        { $match: { "batch": new Types.ObjectId(batchId), "orderId": orderId } }
    ]
}