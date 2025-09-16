import { toOptional, toNumber, toDate } from '@utils/converters';
import { parseAmazonFile } from '@utils/fileUtils';
import { BatchInfo } from '@models/common.model';
import { AMAZON_COLUMNS } from './columns';
import { AmazonOrder } from './types';

export class AmazonMapper {
    process(fileBuffer: Buffer, batch: BatchInfo, lastIndex: number): AmazonOrder[] {
        const rows = parseAmazonFile(fileBuffer);
        return rows.map((row, index) => this.normalize(row as Record<string, any>, batch, index + lastIndex));
    }

    normalize(raw: Record<string, any>, batch: BatchInfo, index: number): AmazonOrder {
        return {
            orderId: raw[AMAZON_COLUMNS.orderId[0]],
            orderStatus: 'UNSHIPPED', // Default status
            product: {
                name: raw[AMAZON_COLUMNS.product.name[0]],
                sku: raw[AMAZON_COLUMNS.product.sku[0]],
                orderItemId: raw[AMAZON_COLUMNS.product.orderItemId[0]],
                quantityPurchased: toNumber(raw[AMAZON_COLUMNS.product.quantityPurchased[0]]),
                quantityShipped: toNumber(raw[AMAZON_COLUMNS.product.quantityShipped[0]]),
                quantityToShip: toNumber(raw[AMAZON_COLUMNS.product.quantityToShip[0]])
            },
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
                uploadedAt: new Date(),
                orderIndex: index
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
}
