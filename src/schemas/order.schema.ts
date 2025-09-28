import mongoose, { Schema, Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { OrderBase, OrderProduct } from '@models/order.model';

export interface IOrderProduct extends OrderProduct { }

export interface IOrder extends OrderBase, Document {
    _id: ObjectId;
    batch: Schema.Types.ObjectId;
}

// Schemas
const ProductSchema = new Schema<OrderProduct>(
    {
        name: { type: String, required: true },
        variation: { type: String },
        sku: { type: String, required: true },
        quantityPurchased: { type: Number, required: true },
        orderItemId: { type: String }, // Amazon-specific
        basePrice: { type: String },
        totalPrice: { type: String },
    },
    { _id: false }
);

const ShippingProductSchema = new Schema(
    {
        sku: { type: String, required: true },
        quantity: { type: Number, required: true },
    },
    { _id: false }
);

const ShippingLabelSchema = new Schema(
    {
        trackingNumber: String,
        trackingStatus: String,
        carrier: String,
        cost: Number,
        serviceType: String,
    },
    { _id: false }
);

const ShippingPackageSchema = new Schema(
    {
        label: { type: ShippingLabelSchema, required: true },
        products: { type: [ShippingProductSchema], default: [] },
    },
    { _id: false }
);

const OrderSchema = new Schema<IOrder>(
    {
        orderId: { type: String, required: true, index: true },
        orderIndex: { type: Number, required: true, index: true },
        orderStatus: { type: String },
        orderReferenceNumber: { type: String },
        products: { type: [ProductSchema], required: true },
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
            packages: { type: [ShippingPackageSchema], default: [] },
            latestShippingTime: Date,
            latestDeliveryTime: Date,
        },
        financial: {
            transactionId: String, // Ebay-specific
        },
        metadata: {
            platform: { type: String, index: true },
            purchaseDate: { type: Date, index: true },
        },
        batch: {
            type: Schema.Types.ObjectId,
            ref: 'Batch',
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

// Indexes
OrderSchema.index({ batch: 1 });
OrderSchema.index({ 'metadata.purchaseDate': -1 });
OrderSchema.index({ 'metadata.platform': 1, 'metadata.purchaseDate': -1 });
OrderSchema.index({ 'products.name': 'text', 'recipient.name': 'text' });

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);
