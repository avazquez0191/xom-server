import mongoose, { Schema, Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import OrderBase from '@models/order.model';

export interface IOrder extends OrderBase, Document {
    _id: ObjectId;
}

const OrderSchema = new Schema<IOrder>({
    orderId: { type: String, required: true, index: true },
    orderStatus: { type: String },
    orderReferenceNumber: { type: String },
    product: {
        name: String,
        variation: String,
        sku: String,
        quantityPurchased: Number,
    },
    recipient: {
        name: String,
        phone: String,
        email: String,
    },
    shipping: {
        address: {
            line1: String,
            line2: String,
            line3: String,
            city: String,
            state: String,
            zip: String,
            country: String,
        },
        label: {
            trackingNumber: String,
            trackingStatus: String,
            carrier: String,
            cost: Number,
            serviceType: String,
        },
        latestShippingTime: Date,
        latestDeliveryTime: Date,
    },
    financial: {
        basePrice: Number,
        totalPrice: Number,
    },
    metadata: {
        platform: { type: String, index: true },
        purchaseDate: { type: Date, index: true },
    },
    batch: {
        id: { type: String, required: true, index: true },
        name: String,
        uploadedAt: Date,
    },
}, { timestamps: true });

OrderSchema.index({ 'batch.id': 1 });
OrderSchema.index({ 'metadata.purchaseDate': -1 });
OrderSchema.index({ 'metadata.platform': 1, 'metadata.purchaseDate': -1 });
OrderSchema.index({ 'product.name': 'text', 'recipient.name': 'text' });

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);
