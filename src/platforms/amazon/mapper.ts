import { toOptional, toNumber, toDate } from '@utils/converters.utils';
import { parseAmazonFile } from '@utils/file.utils';
import { BatchInfo } from '@models/common.model';
import { AMAZON_COLUMNS } from './columns';
import { AmazonOrder } from './types';

export class AmazonMapper {
    process(fileBuffer: Buffer, batch: BatchInfo, lastIndex: number, orderReferenceStart?: number): AmazonOrder[] {
        const rows = parseAmazonFile(fileBuffer);

        const normalizedRows = rows.map(row =>
            this.normalize(row as Record<string, any>, batch)
        );

        const ordersMap = new Map<string, AmazonOrder>();
        let incrementalIndex = lastIndex;

        for (const row of normalizedRows) {
            const existingOrder = ordersMap.get(row.orderId);

            if (existingOrder) {
                // Merge products
                existingOrder.products = [...existingOrder.products, ...row.products];
            } else {
                row.batch.orderIndex = incrementalIndex;
                row.orderReferenceNumber = orderReferenceStart ? (orderReferenceStart + incrementalIndex).toString() : undefined;
                ordersMap.set(row.orderId, row);
                incrementalIndex++;
            }
        }

        return Array.from(ordersMap.values());
    }

    normalize(raw: Record<string, any>, batch: BatchInfo): AmazonOrder {
        return {
            orderId: raw[AMAZON_COLUMNS.orderId[0]],
            orderStatus: 'UNSHIPPED', // Default status
            products: [{
                name: raw[AMAZON_COLUMNS.product.name[0]],
                sku: raw[AMAZON_COLUMNS.product.sku[0]],
                orderItemId: raw[AMAZON_COLUMNS.product.orderItemId[0]],
                quantityPurchased: toNumber(raw[AMAZON_COLUMNS.product.quantityPurchased[0]]),
                quantityShipped: toNumber(raw[AMAZON_COLUMNS.product.quantityShipped[0]]),
                quantityToShip: toNumber(raw[AMAZON_COLUMNS.product.quantityToShip[0]])
            }],
            recipient: {
                name: raw[AMAZON_COLUMNS.recipient.name[0]] || '',
                phone: raw[AMAZON_COLUMNS.recipient.phone[0]] || '',
                email: raw[AMAZON_COLUMNS.recipient.email[0]] || ''
            },
            shipping: {
                address: {
                    line1: raw[AMAZON_COLUMNS.shipping.address.line1[0]],
                    line2: toOptional(raw[AMAZON_COLUMNS.shipping.address.line2[0]]),
                    line3: toOptional(raw[AMAZON_COLUMNS.shipping.address.line3[0]]),
                    city: raw[AMAZON_COLUMNS.shipping.address.city[0]],
                    state: raw[AMAZON_COLUMNS.shipping.address.state[0]],
                    zip: raw[AMAZON_COLUMNS.shipping.address.zip[0]],
                    country: raw[AMAZON_COLUMNS.shipping.address.country[0]]
                },
                shipServiceLevel: raw[AMAZON_COLUMNS.shipping.shipServiceLevel[0]],
                latestShippingTime: toDate(raw[AMAZON_COLUMNS.shipping.latestShippingTime[0]])
            },
            metadata: {
                platform: 'AMAZON',
                purchaseDate: toDate(raw[AMAZON_COLUMNS.metadata.purchaseDate[0]]),
                isBusinessOrder: raw[AMAZON_COLUMNS.metadata.isBusinessOrder[0]] === 'true',
                vergeOfCancellation: raw[AMAZON_COLUMNS.metadata.vergeOfCancellation[0]] === 'true',
                vergeOfLateShipment: raw[AMAZON_COLUMNS.metadata.vergeOfLateShipment[0]] === 'true',
                signatureConfirmationRecommended: raw[AMAZON_COLUMNS.metadata.signatureConfirmationRecommended[0]] === 'true',
            },
            batch: {
                id: batch.id,
                name: batch.name,
                uploadedAt: new Date()
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
}
