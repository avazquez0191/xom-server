import { Readable } from 'stream';
import { OrderBase } from './order.model';

export interface Exporter {
    /**
     * Export the given orders into a specific document format.
     * Should return a Readable stream (CSV, TSV, etc).
     */
    export(orders: OrderBase[]): Readable;

    /**
     * File extension for the exported document
     * (e.g. "csv", "tsv").
     */
    getFileExtension(): string;
}
