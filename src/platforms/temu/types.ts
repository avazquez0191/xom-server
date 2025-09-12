import OrderBase from '@models/Order';

/*
    all TEMU-specific columns
*/
export interface TemuOrder extends OrderBase {
    logisticsServiceSuggestion?: string;
    product: OrderBase['product'] & {
        nameByCustomer?: string;
        contributionSku?: string;
        orderItemId: string;
        orderItemStatus?: string;
        quantityShipped?: number;
        quantityToShip?: number;
    };
    recipient: OrderBase['recipient'] & {
        firstName?: string;
        lastName?: string;
    }
    shipping: OrderBase['shipping'] & {
        address: OrderBase['shipping']['address'] & {
            district?: string;
        };
        keepProofOfShipment?: boolean;
    };
    financial: OrderBase['financial'] & {
        settlementStatus?: string;
    };
    metadata: OrderBase['metadata'] & {
        fulfillmentMode?: string;
        iphoneSerial?: string;
    };
}