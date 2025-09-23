import { Exporter } from '@models/exporter.model';
import { stringify } from 'csv-stringify';
import { Readable } from 'stream';

export class EbayShippingConfirmationExporter implements Exporter {
  export(orders: any[]): Readable {
    const stringifier = stringify({
      header: true,
      columns: ['OrderID', 'Reference', 'TrackingNumber', 'Carrier'],
      delimiter: ',',
    });

    for (const order of orders) {
      stringifier.write([
        order.orderId,
        order.orderReferenceNumber,
        order.shippingConfirmation?.trackingNumber ?? '',
        order.shippingConfirmation?.carrier ?? '',
      ]);
    }

    stringifier.end();
    return stringifier; // a Readable stream
  }

  getFileExtension(): string {
    return 'csv';
  }
}
