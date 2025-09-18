import { Schema, model, Document } from 'mongoose';

export interface Batch extends Document {
  name: string;
  createdAt: Date;
  platforms: string[];
  labelFile?: string;
  orders: Schema.Types.ObjectId[];
}

const BatchSchema = new Schema<Batch>({
  name: { type: String, required: true },
  platforms: [{ type: String, required: true }],
  labelFile: String,
  orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }]
}, { timestamps: { createdAt: true, updatedAt: false } });

export const BatchModel = model<Batch>('Batch', BatchSchema);