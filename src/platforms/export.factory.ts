import { EbayShippingConfirmationExporter } from '@platforms/ebay/exports/shipping-confirmation.exporter';
import { AmazonShippingConfirmationExporter } from '@platforms/amazon/exports/shipping-confirmation.exporter';
import { Exporter } from '@models/exporter.model';

export class ExportFactory {
  static getExporter(platform: string, docType: string): Exporter {
    switch (docType) {
      case 'shipping-confirmation':
        switch (platform.toLowerCase()) {
          case 'ebay':
            return new EbayShippingConfirmationExporter();
          case 'amazon':
            return new AmazonShippingConfirmationExporter();
          default:
            throw new Error(`Unsupported export platform: ${platform}`);
        }
      default:
        throw new Error(`Unsupported document type: ${docType}`);
    }
  }
}
