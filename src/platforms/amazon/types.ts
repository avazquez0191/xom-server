import { OrderBase, OrderProduct } from '@models/order.model';

/*
    all AMAZON-specific columns
*/
export interface AmazonProduct extends OrderProduct {
    orderItemId: string;
    quantityShipped?: number;
    quantityToShip?: number;
}
export interface AmazonOrder extends OrderBase {
    products: AmazonProduct[];
    shipping: OrderBase['shipping'] & {
        shipServiceLevel: string;
    };
    metadata: OrderBase['metadata'] & {
        isBusinessOrder?: boolean;
        vergeOfCancellation?: boolean;
        vergeOfLateShipment?: boolean;
        signatureConfirmationRecommended?: boolean;
    };
}
