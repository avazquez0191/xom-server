import { toOptional, toNumber, toDate, getStateCode } from '@utils/converters.utils';
import { parseEbayFile } from '@utils/file.utils';
import { BatchInfo } from '@models/common.model';
import { EBAY_COLUMNS } from './columns';
import { EbayOrder } from './types';

export class EbayMapper {
    process(fileBuffer: Buffer, lastIndex: number, orderReferenceStart?: number): EbayOrder[] {
        const rows = parseEbayFile(fileBuffer);

        const normalizedRows = rows.map(row =>
            this.normalize(row as Record<string, any>)
        );

        const ordersMap = new Map<string, EbayOrder>();
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
                        ...row.shipping.packages
                    ];
                }
            } else {
                row.orderIndex = incrementalIndex;
                row.orderReferenceNumber = orderReferenceStart
                    ? (orderReferenceStart + incrementalIndex).toString()
                    : undefined;
                ordersMap.set(row.orderId, row);
                incrementalIndex++;
            }
        }

        return Array.from(ordersMap.values());
    }

    normalize(raw: Record<string, any>): EbayOrder {
        const trackingNumber = toOptional(raw[EBAY_COLUMNS.shipping.label.trackingNumber[0]]);
        const serviceType = toOptional(raw[EBAY_COLUMNS.shipping.label.serviceType[0]]);

        return {
            salesRecordNumber: raw[EBAY_COLUMNS.salesRecordNumber[0]],
            orderId: raw[EBAY_COLUMNS.orderId[0]],
            orderStatus: 'UNSHIPPED', // Default status
            products: [
                {
                    name: raw[EBAY_COLUMNS.product.name[0]],
                    variation: raw[EBAY_COLUMNS.product.variation[0]] || '',
                    sku: raw[EBAY_COLUMNS.product.sku[0]],
                    quantityPurchased: toNumber(raw[EBAY_COLUMNS.product.quantityPurchased[0]]),
                    basePrice: toOptional(raw[EBAY_COLUMNS.product.basePrice[0]]),
                    totalPrice: toOptional(raw[EBAY_COLUMNS.product.totalPrice[0]]),
                },
            ],
            recipient: {
                name: raw[EBAY_COLUMNS.recipient.name[0]] || '',
                phone: raw[EBAY_COLUMNS.recipient.phone[0]] || '',
                email: raw[EBAY_COLUMNS.recipient.email[0]] || '',
            },
            shipping: {
                address: {
                    line1: raw[EBAY_COLUMNS.shipping.address.line1[0]],
                    line2: toOptional(raw[EBAY_COLUMNS.shipping.address.line2[0]]),
                    city: raw[EBAY_COLUMNS.shipping.address.city[0]],
                    state: getStateCode(raw[EBAY_COLUMNS.shipping.address.state[0]]),
                    zip: raw[EBAY_COLUMNS.shipping.address.zip[0]],
                    country: raw[EBAY_COLUMNS.shipping.address.country[0]],
                },
                packages: trackingNumber
                    ? [
                        {
                            label: {
                                trackingNumber,
                                serviceType,
                            },
                            products: [], // initially empty, to be filled when confirming shipping
                        },
                    ]
                    : [],
            },
            financial: {
                transactionId: toOptional(raw[EBAY_COLUMNS.financial.transactionId[0]])
            },
            metadata: {
                platform: 'EBAY',
                ebayFulfillmentProgram:
                    raw[EBAY_COLUMNS.metadata.ebayFulfillmentProgram[0]] === 'YES',
                purchaseDate: toDate(raw[EBAY_COLUMNS.metadata.purchaseDate[0]]),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
}
