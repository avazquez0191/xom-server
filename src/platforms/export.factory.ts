import { Exporter } from '@models/exporter.model';
import { EbayShippingConfirmationExporter } from './ebay/exports/shipping-confirmation.exporter';
import { EbayAccountingExporter } from './ebay/exports/accounting.exporter';
import { AmazonShippingConfirmationExporter } from '@platforms/amazon/exports/shipping-confirmation.exporter';
import { AmazonAccountingExporter } from './amazon/exports/accounting.exporter';

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
      case 'accounting':
        switch (platform.toLowerCase()) {
          case 'ebay':
            return new EbayAccountingExporter();
          case 'amazon':
            return new AmazonAccountingExporter();
          default:
            throw new Error(`Unsupported export platform: ${platform}`);
        }
      default:
        throw new Error(`Unsupported document type: ${docType}`);
    }
  }
}
