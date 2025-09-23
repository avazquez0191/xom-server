import { Batch } from '@models/batch.model';
import { Schema, model, Document } from 'mongoose';

export interface IBatch extends Batch, Document { }

const BatchSchema = new Schema<IBatch>({
    name: { type: String, required: true },
    platforms: [{ type: String, required: true }],
    labelFile: String,
    orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }]
}, { timestamps: { createdAt: true, updatedAt: false } });

export const BatchModel = model<Batch>('Batch', BatchSchema);