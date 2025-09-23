import { OrderBase } from "./order.model";

export type Platform = 'temu' | 'ebay' | 'amazon' | false;

export interface BatchInfo {
    id: string;
    name: string;
}

export interface FilePlatformPair {
    file: Express.Multer.File;
    platform: string;
}

export interface ProcessOrderUploadResult {
    success: boolean;
    insertedCount: number;
    orders: OrderBase[];
    batch: any
};

export interface ShippingConfirmation {
    orderId: string;
    trackingNumbers: string[];
    cost: number;
}

export interface ListOptions { 
    page?: number;
    limit?: number;
    disablePagination?: boolean;
}