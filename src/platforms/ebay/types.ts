import { OrderBase } from '@models/order.model';

/*
    all EBAY-specific columns
*/
export interface EbayOrder extends OrderBase {
    salesRecordNumber: string;
    financial: OrderBase['financial'] & {
        transactionId?: string;
    };
    metadata: OrderBase['metadata'] & {
        ebayFulfillmentProgram?: boolean;
    };
}