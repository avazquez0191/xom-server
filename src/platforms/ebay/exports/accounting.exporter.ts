// shipping-confirmation.exporter.ts
import { Exporter } from '@models/exporter.model';
import { stringify } from 'csv-stringify';
import { Readable } from 'stream';
import { EbayOrder } from '../types';
import { roundToHalf } from '@utils/converters.utils';

export class EbayAccountingExporter implements Exporter {
    export(orders: EbayOrder[]): Readable {
        const stringifier = stringify({
            header: true,
            columns: [
                'comments',
                'store',
                'date',
                'platform id',
                'konga id',
                'description',
                'quantity',
                'base price',
                'shipping',
                'empty-column',
                'empty-column',
                'refund',
                'total',
                'sku',
            ],
        });

        for (const order of orders) {
            // Sum all package shipping costs
            const totalShipping = order.shipping?.packages
                ? order.shipping.packages.reduce((sum, pkg) => sum + roundToHalf(pkg.label?.cost ?? 0), 0)
                : 0;

            order.products.forEach((product, idx: number) => {
                stringifier.write([
                    '', // comments
                    'ebay', // store
                    `${order.metadata.purchaseDate.getMonth() + 1}/${order.metadata.purchaseDate.getDate()}/${order.metadata.purchaseDate.getFullYear()}`, // date
                    order.orderId, // platform id
                    order.orderReferenceNumber ?? '', // konga id (placeholder)
                    `[Ebay] ${product.name} - ${product.variation}`, // description
                    product.quantityPurchased, // quantity
                    product.basePrice?.toFixed(2) ?? '', // base price
                    idx === 0 ? totalShipping.toFixed(2) : '', // shipping
                    '', // empty-column
                    '', // empty-column
                    '', // refund
                    product.totalPrice?.toFixed(2) ?? '', // total
                    product.sku, // sku
                ]);
            });
        }

        stringifier.end();
        return stringifier; // Readable stream
    }

    getFileExtension(): string {
        return 'csv';
    }
}
