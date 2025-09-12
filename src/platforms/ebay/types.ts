import OrderBase from '@models/Order';

/*
    all EBAY-specific columns
*/
export interface EbayOrder extends OrderBase {
    salesRecordNumber: string;
    metadata: OrderBase['metadata'] & {
        ebayFulfillmentProgram?: boolean;
    };
}