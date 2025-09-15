import OrderBase from '@models/order.model';

/*
    all EBAY-specific columns
*/
export interface EbayOrder extends OrderBase {
    salesRecordNumber: string;
    metadata: OrderBase['metadata'] & {
        ebayFulfillmentProgram?: boolean;
    };
}