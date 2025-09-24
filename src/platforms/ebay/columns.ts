export const EBAY_COLUMNS = {
    salesRecordNumber: ['Sales Record Number'],
    orderId: ['Order Number'],
    product: {
        name: ['Item Title'],
        variation: ['Variation Details'],
        sku: ['Item Number'],
        quantityPurchased: ['Quantity']
    },
    recipient: {
        name: ['Ship To Name'],
        phone: ['Ship To Phone'],
        email: ['Buyer Email']
    },
    shipping: {
        address: {
            line1: ['Ship To Address 1'],
            line2: ['Ship To Address 2'],
            city: ['Ship To City'],
            state: ['Ship To State'],
            zip: ['Ship To Zip'],
            country: ['Ship To Country']
        },
        label: {
            trackingNumber: ['Tracking Number'],
            serviceType: ['Shipping Service']
        }
    },
    financial: {
        basePrice: ['Sold For'],
        totalPrice: ['Total Price'],
        transactionId: ['Transaction ID']
    },
    metadata: {
        purchaseDate: ['Sale Date'],
        ebayFulfillmentProgram: ['eBay Fulfillment Program']
    }
} as const;