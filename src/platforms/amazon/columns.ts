export const AMAZON_COLUMNS = {
    orderId: ['order-id'],
    product: {
        name: ['product-name'],
        variation: [], // Amazon file doesn’t provide variation details
        sku: ['sku'],
        orderItemId: ['order-item-id'],
        quantityPurchased: ['quantity-purchased'],
        quantityShipped: ['quantity-shipped'],
        quantityToShip: ['quantity-to-ship']
    },
    recipient: {
        name: ['recipient-name'],
        phone: ['buyer-phone-number'],
        email: ['buyer-email']
    },
    shipping: {
        address: {
            line1: ['ship-address-1'],
            line2: ['ship-address-2'],
            line3: ['ship-address-3'],
            city: ['ship-city'],
            state: ['ship-state'],
            zip: ['ship-postal-code'],
            country: ['ship-country']
        },
        shipServiceLevel: ['ship-service-level'],
        latestShippingTime: ['promise-date']
    },
    metadata: {
        purchaseDate: ['purchase-date'],
        isBusinessOrder: ['is-business-order'],
        vergeOfCancellation: ['verge-of-cancellation'],
        vergeOfLateShipment: ['verge-of-lateShipment'],
        signatureConfirmationRecommended: ['signature-confirmation-recommended'],
        buyerIdentificationNumber: ['buyer-identification-number'],
        buyerIdentificationType: ['buyer-identification-type']
    }
} as const;
