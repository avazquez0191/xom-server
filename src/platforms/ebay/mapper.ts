import { toOptional, toNumber, toDate } from '@utils/converters';
import { generateBatchId } from '@utils/common.util';
import { parseEbayFile } from '@utils/file-utils';
import { EBAY_COLUMNS } from './columns';
import { EbayOrder } from './types';

export class EbayMapper {
    process(fileBuffer: Buffer): EbayOrder[] {
        const rows = parseEbayFile(fileBuffer);
        return rows.map(row => this.normalize(row as Record<string, any>));
    }

    normalize(raw: Record<string, any>): EbayOrder {
        const batch = generateBatchId();
        return {
            salesRecordNumber: raw[EBAY_COLUMNS.salesRecordNumber[0]],
            orderId: raw[EBAY_COLUMNS.orderId[0]],
            orderStatus: 'UNSHIPPED', // Default status
            product: {
                name: raw[EBAY_COLUMNS.product.name[0]],
                variation: raw[EBAY_COLUMNS.product.variation[0]] || '',
                sku: raw[EBAY_COLUMNS.product.sku[0]],
                quantityPurchased: toNumber(raw[EBAY_COLUMNS.product.quantityPurchased[0]])
            },
            recipient: {
                name: raw[EBAY_COLUMNS.recipient.name[0]] || '',
                phone: raw[EBAY_COLUMNS.recipient.phone[0]] || '',
                email: raw[EBAY_COLUMNS.recipient.email[0]] || ''
            },
            shipping: {
                address: {
                    line1: raw[EBAY_COLUMNS.shipping.address.line1[0]],
                    line2: toOptional(raw[EBAY_COLUMNS.shipping.address.line2[0]]),
                    city: raw[EBAY_COLUMNS.shipping.address.city[0]],
                    state: raw[EBAY_COLUMNS.shipping.address.state[0]],
                    zip: raw[EBAY_COLUMNS.shipping.address.zip[0]],
                    country: raw[EBAY_COLUMNS.shipping.address.country[0]]
                },
                label: {
                    trackingNumber: toOptional(raw[EBAY_COLUMNS.shipping.label.trackingNumber[0]]),
                    serviceType: toOptional(raw[EBAY_COLUMNS.shipping.label.serviceType[0]])
                }
            },
            financial: {
                basePrice: toNumber(raw[EBAY_COLUMNS.financial.basePrice[0]]),
                totalPrice: toNumber(raw[EBAY_COLUMNS.financial.totalPrice[0]])
            },
            metadata: {
                platform: 'EBAY',
                ebayFulfillmentProgram: raw[EBAY_COLUMNS.metadata.ebayFulfillmentProgram[0]] === 'YES',
                purchaseDate: toDate(raw[EBAY_COLUMNS.metadata.purchaseDate[0]])
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