import { OrderBase, OrderProduct } from '@models/order.model';

/*
    all TEMU-specific columns
*/
export interface TemuProduct extends OrderProduct {
    nameByCustomer?: string;
    contributionSku?: string;
    orderItemId: string; // required
    orderItemStatus?: string;
    quantityShipped?: number;
    quantityToShip?: number;
}
export interface TemuOrder extends OrderBase {
    logisticsServiceSuggestion?: string;
    products: TemuProduct[];
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