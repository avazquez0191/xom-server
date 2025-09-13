import { toOptional, toNumber, toDate } from '@utils/converters';
import { generateBatchId } from '@utils/common.util';
import { parseTemuFile } from '@utils/file-utils';
import { TEMU_COLUMNS } from './columns';
import { TemuOrder } from './types';

export class TemuMapper {
    process(fileBuffer: Buffer): TemuOrder[] {
        const rows = parseTemuFile(fileBuffer);
        return rows.map(row => this.normalize(row as Record<string, any>));
    }
    normalize(raw: Record<string, any>): TemuOrder {
        const batch = generateBatchId();
        return {
            orderId: raw[TEMU_COLUMNS.orderId[0]],
            orderStatus: raw[TEMU_COLUMNS.orderStatus[0]],
            logisticsServiceSuggestion: toOptional(raw[TEMU_COLUMNS.logisticsServiceSuggestion[0]]),
            product: {
                name: raw[TEMU_COLUMNS.product.name[0]],
                nameByCustomer: toOptional(raw[TEMU_COLUMNS.product.nameByCustomer[0]]),
                variation: raw[TEMU_COLUMNS.product.variation[0]],
                sku: raw[TEMU_COLUMNS.product.sku[0]],
                contributionSku: raw[TEMU_COLUMNS.product.contributionSku[0]],
                orderItemId: raw[TEMU_COLUMNS.product.orderItemId[0]],
                orderItemStatus: raw[TEMU_COLUMNS.product.orderItemStatus[0]],
                quantityPurchased: toNumber(raw[TEMU_COLUMNS.product.quantityPurchased[0]]),
                quantityShipped: toNumber(raw[TEMU_COLUMNS.product.quantityShipped[0]]),
                quantityToShip: toNumber(raw[TEMU_COLUMNS.product.quantityToShip[0]])
            },
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
                    state: raw[TEMU_COLUMNS.shipping.address.state[0]],
                    zip: raw[TEMU_COLUMNS.shipping.address.zip[0]],
                    country: raw[TEMU_COLUMNS.shipping.address.country[0]]
                },
                label: {
                    trackingNumber: toOptional(raw[TEMU_COLUMNS.shipping.label.trackingNumber[0]]),
                    carrier: toOptional(raw[TEMU_COLUMNS.shipping.label.carrier[0]]),
                },
                latestShippingTime: toDate(raw[TEMU_COLUMNS.shipping.latestShippingTime[0]]),
                latestDeliveryTime: toDate(raw[TEMU_COLUMNS.shipping.latestDeliveryTime[0]]),
                keepProofOfShipment: raw[TEMU_COLUMNS.shipping.keepProofOfShipment[0]] === 'YES'
            },
            financial: {
                basePrice: toNumber(raw[TEMU_COLUMNS.financial.basePrice[0]]),
                totalPrice: toNumber(raw[TEMU_COLUMNS.financial.totalPrice[0]]),
                settlementStatus: raw[TEMU_COLUMNS.financial.settlementStatus[0]]
            },
            metadata: {
                platform: 'TEMU',
                fulfillmentMode: raw[TEMU_COLUMNS.metadata.fulfillmentMode[0]],
                purchaseDate: toDate(raw[TEMU_COLUMNS.metadata.purchaseDate[0]]),
                iphoneSerial: toOptional(raw[TEMU_COLUMNS.metadata.iphoneSerial[0]])
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