import OrderBase from '@models/Order';

/*
    all AMAZON-specific columns
*/
export interface AmazonOrder extends OrderBase {
    product: OrderBase['product'] & {
        orderItemId: string;
        quantityShipped?: number;
        quantityToShip?: number;
    };
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
