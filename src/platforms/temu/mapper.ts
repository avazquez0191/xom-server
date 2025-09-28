import { toOptional, toNumber, toDate, getStateCode } from '@utils/converters.utils';
import { parseTemuFile } from '@utils/file.utils';
import { TEMU_COLUMNS } from './columns';
import { TemuOrder } from './types';

export class TemuMapper {
    process(fileBuffer: Buffer, lastIndex: number, orderReferenceStart?: number): TemuOrder[] {
        const rows = parseTemuFile(fileBuffer);

        const normalizedRows = rows.map(row =>
            this.normalize(row as Record<string, any>)
        );

        const ordersMap = new Map<string, TemuOrder>();
        let incrementalIndex = lastIndex;

        for (const row of normalizedRows) {
            const existingOrder = ordersMap.get(row.orderId);

            if (existingOrder) {
                // Merge products
                existingOrder.products = [...existingOrder.products, ...row.products];
                // Merge packages if tracking info exists
                if (row.shipping.packages && row.shipping.packages.length > 0) {
                    // skip if tracking number already exists
                    const existingTrackingNumbers = new Set(
                        (existingOrder.shipping.packages || []).map(
                            pkg => pkg.label.trackingNumber
                        )
                    );
                    row.shipping.packages = row.shipping.packages.filter(
                        pkg => !existingTrackingNumbers.has(pkg.label.trackingNumber)
                    );
                    // Append new packages
                    existingOrder.shipping.packages = [
                        ...(existingOrder.shipping.packages || []),
                        ...row.shipping.packages,
                    ];
                }
            } else {
                row.orderIndex = incrementalIndex;
                row.orderReferenceNumber = orderReferenceStart ? (orderReferenceStart + incrementalIndex).toString() : undefined;
                ordersMap.set(row.orderId, row);
                incrementalIndex++;
            }
        }

        return Array.from(ordersMap.values());
    }
    normalize(raw: Record<string, any>): TemuOrder {
        const trackingNumber = toOptional(raw[TEMU_COLUMNS.shipping.label.trackingNumber[0]]);
        const carrier = toOptional(raw[TEMU_COLUMNS.shipping.label.carrier[0]]);
        return {
            orderId: raw[TEMU_COLUMNS.orderId[0]],
            orderStatus: raw[TEMU_COLUMNS.orderStatus[0]],
            logisticsServiceSuggestion: toOptional(raw[TEMU_COLUMNS.logisticsServiceSuggestion[0]]),
            products: [{
                name: raw[TEMU_COLUMNS.product.name[0]],
                nameByCustomer: toOptional(raw[TEMU_COLUMNS.product.nameByCustomer[0]]),
                variation: raw[TEMU_COLUMNS.product.variation[0]],
                sku: raw[TEMU_COLUMNS.product.sku[0]],
                contributionSku: raw[TEMU_COLUMNS.product.contributionSku[0]],
                orderItemId: raw[TEMU_COLUMNS.product.orderItemId[0]],
                orderItemStatus: raw[TEMU_COLUMNS.product.orderItemStatus[0]],
                quantityPurchased: toNumber(raw[TEMU_COLUMNS.product.quantityPurchased[0]]),
                quantityShipped: toNumber(raw[TEMU_COLUMNS.product.quantityShipped[0]]),
                quantityToShip: toNumber(raw[TEMU_COLUMNS.product.quantityToShip[0]]),
                basePrice: toOptional(raw[TEMU_COLUMNS.product.basePrice[0]]),
                totalPrice: toOptional(raw[TEMU_COLUMNS.product.totalPrice[0]]),
            }],
            recipient: {
                name: raw[TEMU_COLUMNS.recipient.name[0]],
                firstName: toOptional(raw[TEMU_COLUMNS.recipient.firstName[0]]),
                lastName: toOptional(raw[TEMU_COLUMNS.recipient.lastName[0]]),
                phone: raw[TEMU_COLUMNS.recipient.phone[0]],
                email: raw[TEMU_COLUMNS.recipient.email[0]]
            },
            shipping: {
                address: {
                    line1: raw[TEMU_COLUMNS.shipping.address.line1[0]],
                    line2: toOptional(raw[TEMU_COLUMNS.shipping.address.line2[0]]),
                    line3: toOptional(raw[TEMU_COLUMNS.shipping.address.line3[0]]),
                    district: toOptional(raw[TEMU_COLUMNS.shipping.address.district[0]]),
                    city: raw[TEMU_COLUMNS.shipping.address.city[0]],
                    state: getStateCode(raw[TEMU_COLUMNS.shipping.address.state[0]]),
                    zip: raw[TEMU_COLUMNS.shipping.address.zip[0]],
                    country: raw[TEMU_COLUMNS.shipping.address.country[0]]
                },
                packages: trackingNumber
                    ? [
                        {
                            label: {
                                trackingNumber,
                                carrier,
                            },
                            products: [], // initially empty, to be filled when confirming shipping
                        },
                    ]
                    : [],
                latestShippingTime: toDate(raw[TEMU_COLUMNS.shipping.latestShippingTime[0]]),
                latestDeliveryTime: toDate(raw[TEMU_COLUMNS.shipping.latestDeliveryTime[0]]),
                keepProofOfShipment: raw[TEMU_COLUMNS.shipping.keepProofOfShipment[0]] === 'YES'
            },
            financial: {
                settlementStatus: raw[TEMU_COLUMNS.financial.settlementStatus[0]]
            },
            metadata: {
                platform: 'TEMU',
                fulfillmentMode: raw[TEMU_COLUMNS.metadata.fulfillmentMode[0]],
                purchaseDate: toDate(raw[TEMU_COLUMNS.metadata.purchaseDate[0]]),
                iphoneSerial: toOptional(raw[TEMU_COLUMNS.metadata.iphoneSerial[0]])
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
}