/*
    all TEMU-specific columns
*/
export const TEMU_COLUMNS = {
    orderId: ['order id'],
    orderStatus: ['order status'],
    logisticsServiceSuggestion: ['Logistics service suggestion'],
    orderItemId: ['Order item ID'],
    orderItemStatus: ['order item status'],
    product: {
        name: ['product name'],
        nameByCustomer: ['product name by customer order'],
        variation: ['variation'],
        skuId: ['sku id'],
        contributionSku: ['contribution sku'],
        quantityPurchased: ['quantity purchased'],
        quantityShipped: ['quantity shipped'],
        quantityToShip: ['quantity to ship']
    },
    recipient: {
        name: ['recipient name'],
        firstName: ['recipient first name'],
        lastName: ['recipient last name'],
        phone: ['recipient phone number'],
        email: ['virtual email']
    },
    shipping: {
        address: {
            line1: ['ship address 1'],
            line2: ['ship address 2'],
            line3: ['ship address 3'],
            district: ['district'],
            city: ['ship city'],
            state: ['ship state'],
            postalCode: ['ship postal code (Must be shipped to the following zip code.)'],
            country: ['ship country']
        },
        carrier: ['carrier'],
        trackingNumber: ['tracking number']
    },
    financial: {
        basePrice: ['activity goods base price'],
        basePriceTotal: ['base price total'],
        settlementStatus: ['order settlement status']
    },
    metadata: {
        purchaseDate: ['purchase date'],
        iphoneSerial: ['iPhone serial number'],
        requiresShipmentProof: ['keep proof of shipment before delivery']
    }
} as const;