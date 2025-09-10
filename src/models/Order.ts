import { ObjectId } from 'mongodb';

export default interface OrderBase {
  _id?: ObjectId;
  orderId: string;
  orderStatus: string;
  logisticsServiceSuggestion?: string;
  orderItemStatus: string;
  orderReferenceNumber?: string;
  product: {
    name: string;
    nameByCustomer?: string;
    variation: string;
    skuId: string;
    contributionSku?: string;
    orderItemId: string;
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
      serviceType?: string;
    };
    latestShippingTime?: Date;
    latestDeliveryTime?: Date;
    keepProofOfShipment?: boolean;
  };
  financial: {
    basePrice: number;
    basePriceTotal: number;
    settlementStatus: string;
  };
  metadata: {
    platform: string;
    fulfillmentMode: string;
    purchaseDate: Date;
    iphoneSerial?: string;
  };
  batch: {
    id: string;
    name: string;
    uploadedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}