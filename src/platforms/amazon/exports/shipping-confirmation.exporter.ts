import { Exporter } from '@models/exporter.model';
import { stringify } from 'csv-stringify';
import { Readable } from 'stream';
import { AmazonOrder } from '../types';

export class AmazonShippingConfirmationExporter implements Exporter {
  export(orders: AmazonOrder[]): Readable {
    const stringifier = stringify({
      header: true,
      columns: ['order-id', 'order-item-id', 'quantity', 'ship-date', 'carrier-code', 'carrier-name', 'tracking-number', 'ship-method', 'transparency_code', 'ship_from_address_name', 'ship_from_address_line1', 'ship_from_address_line2', 'ship_from_address_line3', 'ship_from_address_city', 'ship_from_address_county', 'ship_from_address_state_or_region', 'ship_from_address_postalcode', 'ship_from_address_countrycode'],
      delimiter: '\t',
    });

    for (const order of orders) {
        for (const product of order.products) {
            stringifier.write([
              order.orderId,
              product.orderItemId,
              product.quantityPurchased,
              new Date().toLocaleDateString('en-US'),
            //   order.carrierCode,
            //   order.carrierName,
            //   order.trackingNumber,
            //   order.shipMethod,
            //   order.transparencyCode,
            //   order.shipFromAddressName,
            //   order.shipFromAddressLine1,
            //   order.shipFromAddressLine2,
            //   order.shipFromAddressLine3,
            //   order.shipFromAddressCity,
            //   order.shipFromAddressCounty,
            //   order.shipFromAddressStateOrRegion,
            //   order.shipFromAddressPostalCode,
            //   order.shipFromAddressCountryCode,
            ]);
        }
    }

    stringifier.end();
    return stringifier; // a Readable stream
  }

  getFileExtension(): string {
    return 'tsv';
  }
}
