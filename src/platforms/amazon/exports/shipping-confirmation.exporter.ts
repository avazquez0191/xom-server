// shipping-confirmation.exporter.ts
import { Exporter } from '@models/exporter.model';
import { stringify } from 'csv-stringify';
import { Readable } from 'stream';
import { AmazonOrder, AmazonProduct } from '../types';

export class AmazonShippingConfirmationExporter implements Exporter {
    export(orders: AmazonOrder[]): Readable {
        const stringifier = stringify({
            header: true,
            columns: [
                'order-id',
                'order-item-id',
                'quantity',
                'ship-date',
                'carrier-code',
                'carrier-name',
                'tracking-number',
                'ship-method',
                'transparency_code',
                'ship_from_address_name',
                'ship_from_address_line1',
                'ship_from_address_line2',
                'ship_from_address_line3',
                'ship_from_address_city',
                'ship_from_address_county',
                'ship_from_address_state_or_region',
                'ship_from_address_postalcode',
                'ship_from_address_countrycode',
            ],
            delimiter: '\t',
        });

        for (const order of orders) {
            if (!order.shipping?.packages) continue;

            for (const pkg of order.shipping.packages) {
                const trackingNumber = pkg.label?.trackingNumber ?? '';
                const carrier = pkg.label?.carrier ?? '';
                const serviceType = pkg.label?.serviceType ?? '';

                for (const pkgProduct of pkg.products) {
                    // skip products with zero quantity
                    if (pkgProduct.quantity <= 0) continue;
                    
                    const product: AmazonProduct | undefined = order.products.find(
                        (p) => p.sku === pkgProduct.sku
                    );

                    stringifier.write([
                        order.orderId, // order-id
                        product?.orderItemId ?? '', // order-item-id (if available in your schema)
                        pkgProduct.quantity, // quantity from the package
                        `${new Date().getMonth() + 1}/${new Date().getDate()}/${new Date().getFullYear()}`, // ship-date in M/D/YYYY
                        carrier, // carrier-name
                        '', // carrier-code (can be mapped if needed)
                        trackingNumber, // tracking-number
                        serviceType, // ship-method
                        '', // transparency_code
                        '', // ship_from_address_name
                        '', // ship_from_address_line1
                        '', // ship_from_address_line2
                        '', // ship_from_address_line3
                        '', // ship_from_address_city
                        '', // ship_from_address_county
                        '', // ship_from_address_state_or_region
                        '', // ship_from_address_postalcode
                        '', // ship_from_address_countrycode
                    ]);
                }
            }
        }

        stringifier.end();
        return stringifier; // a Readable stream
    }

    getFileExtension(): string {
        return 'tsv';
    }
}
