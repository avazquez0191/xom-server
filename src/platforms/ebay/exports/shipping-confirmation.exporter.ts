// shipping-confirmation.exporter.ts
import { Exporter } from '@models/exporter.model';
import { stringify } from 'csv-stringify';
import { Readable } from 'stream';
import { OrderProduct } from '@models/order.model';
import { EbayOrder } from '../types';

export class EbayShippingConfirmationExporter implements Exporter {
    export(orders: EbayOrder[]): Readable {
        const columns = [
            'Shipping Status',
            'Order Number',
            'Item Number',
            'Item Title',
            'Custom Label',
            'Transaction ID',
            'Shipping Carrier Used',
            'Tracking Number',
        ];

        const stringifier = stringify({
            header: false, // we will write headers manually
            delimiter: ',',
        });

        // Add extra info row above headers
        stringifier.write(['#INFO']);

        // Write headers manually
        stringifier.write(columns);

        for (const order of orders) {
            if (!order.shipping?.packages) continue;

            for (const pkg of order.shipping.packages) {
                const trackingNumber = pkg.label?.trackingNumber ?? '';
                const carrier = pkg.label?.carrier ?? '';

                for (const pkgProduct of pkg.products) {
                    // skip products with zero quantity
                    if (pkgProduct.quantity <= 0) continue;

                    const product: OrderProduct | undefined = order.products.find(
                        (p) => p.sku === pkgProduct.sku
                    );

                    stringifier.write([
                        'Shipped', // Shipping Status
                        order.orderId, // Order Number
                        pkgProduct.sku, // Item Number
                        product?.name ?? '', // Item Title
                        '', // Custom Label (blank for now)
                        order.financial?.transactionId ?? '', // Transaction ID
                        carrier, // Shipping Carrier Used
                        trackingNumber, // Tracking Number
                    ]);
                }
            }
        }

        stringifier.end();
        return stringifier;
    }

    getFileExtension(): string {
        return 'csv';
    }
}
