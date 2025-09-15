export interface BatchAggregateResult {
  metadata: { total: number }[];
  data: any[]; // can refine later
}

export interface OrderAggregateResult {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  purchaseDate: Date;
  items: {
    sku: string;
    productName: string;
    qty: number;
    price: number;
    currency: string;
    meta?: any;
  }[];
  totalQty: number;
  totalAmount: number;
}