// shipping-confirmation.exporter.ts
import { Exporter } from '@models/exporter.model';
import { stringify } from 'csv-stringify';
import { Readable } from 'stream';
import { OrderProduct } from '@models/order.model';
import { EbayOrder } from '../types';

export class EbayShippingConfirmationExporter implements Exporter {
  export(orders: EbayOrder[]): Readable {
    const stringifier = stringify({
      header: true,
      columns: [
        'Shipping Status',
        'Order Number',
        'Item Number',
        'Item Title',
        'Custom Label',
        'Transaction ID',
        'Shipping Carrier Used',
        'Tracking Number',
      ],
      delimiter: ',',
    });

    for (const order of orders) {
      if (!order.shipping?.packages) continue;

      for (const pkg of order.shipping.packages) {
        const trackingNumber = pkg.label?.trackingNumber ?? '';
        const carrier = pkg.label?.carrier ?? '';

        for (const pkgProduct of pkg.products) {
          const product: OrderProduct | undefined = order.products.find(
            (p) => p.sku === pkgProduct.sku
          );

          stringifier.write([
            'Shipped', // Shipping Status
            order.orderId, // Order Number
            pkgProduct.sku, // Item Number
            product?.name ?? '', // Item Title (from order.products)
            '', // Custom Label (blank for now)
            order.financial.transactionId ?? '', // Transaction ID
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
