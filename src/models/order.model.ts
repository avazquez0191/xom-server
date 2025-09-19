import { ObjectId } from 'mongodb';

export interface OrderBase {
  _id?: ObjectId;
  orderId: string;
  orderIndex?: number;
  orderStatus?: string;
  orderReferenceNumber?: string;
  products: OrderProduct[];
  recipient: {
    name: string;
    phone: string;
    email: string;
  };
  shipping: {
    address: {
      line1: string;
      line2?: string;
      line3?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    labels?: ShippingLabel[];
    latestShippingTime?: Date;
    latestDeliveryTime?: Date;
  };
  financial?: {
    basePrice?: number;
    totalPrice?: number;
  };
  metadata: {
    platform: string;
    purchaseDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderProduct {
  name: string;
  variation?: string;
  sku: string;
  quantityPurchased: number;
}

export interface ShippingLabel {
  trackingNumber?: string;
  trackingStatus?: string;
  carrier?: string;
  cost?: number;
  serviceType?: string;
}