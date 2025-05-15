import { ObjectId } from 'mongodb';

export default interface OrderBase {
  _id?: ObjectId;
  orderId: string;
  orderStatus: string;
  logisticsServiceSuggestion?: string;
  orderItemId: string;
  orderItemStatus: string;
  orderReferenceNumber?: string;
  product: {
    name: string;
    nameByCustomer?: string;
    variation: string;
    skuId: string;
    contributionSku?: string;
    quantityPurchased: number;
    quantityShipped: number;
    quantityToShip: number;
  };
  recipient: {
    name: string;
    firstName?: string;
    lastName?: string;
    phone: string;
    email: string;
  };
  shipping: {
    address: {
      line1: string;
      line2?: string;
      line3?: string;
      district?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    label: {
      trackingNumber?: string;
      trackingStatus?: string;
      carrier?: string;
      cost?: number;
    }
    latestShippingTime: Date;
    latestDeliveryTime: Date;
  };
  financial: {
    basePrice: number;
    basePriceTotal: number;
    settlementStatus: string;
  };
  metadata: {
    purchaseDate: Date;
    iphoneSerial?: string;
    requiresShipmentProof: boolean;
  };
  batch: {
    id: string;
    name: string;
    uploadedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}