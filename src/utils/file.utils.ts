import { parse } from 'csv-parse/sync';
import multer from 'multer';
import xlsx from 'xlsx';
import QRCode from "qrcode";
import bwipjs from "bwip-js";

// General parser for Excel
export const parseBufferFileToRawJSON = (buffer: Buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const orders = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return orders;
};

// Temu-specific parser (CSV)
export const parseTemuFile = (fileBuffer: Buffer): Record<string, any>[] => {
  const content = fileBuffer.toString('utf8');
  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true
    }) as Record<string, any>[];
    return records;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Temu CSV parsing failed: ${message}`);
  }
};

// eBay-specific parser (CSV)
export const parseEbayFile = (fileBuffer: Buffer): Record<string, any>[] => {
  const content = fileBuffer.toString('utf8');
  const lines = content.split('\n');

  // Find the header row (skip initial empty lines)
  const headerLineIndex = lines.findIndex(line =>
    line.includes('Sales Record Number') &&
    line.includes('Order Number')
  );

  if (headerLineIndex === -1) {
    throw new Error('Invalid eBay file: No headers found');
  }

  // Extract only the relevant part of the file (from headers onward)
  const relevantLines = lines.slice(headerLineIndex);

  // Remove footer lines
  const dataLines = relevantLines.filter(line =>
    !line.includes('record(s) downloaded') &&
    !line.includes('Seller ID :') &&
    line.trim().length > 0
  );

  // Join back into CSV content
  const csvContent = dataLines.join('\n');

  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true
    }) as Record<string, any>[];

    // Filter out any remaining empty records
    return records.filter(record =>
      record && record['Sales Record Number'] && record['Sales Record Number'].trim().length > 0
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`eBay CSV parsing failed: ${message}`);
  }
};

// Amazon-specific parser (tab-separated)
export const parseAmazonFile = (fileBuffer: Buffer): Record<string, any>[] => {
  const csvContent = fileBuffer.toString('utf8');
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true,
      delimiter: '\t'
    }) as Record<string, any>[];
    return records;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`amazon CSV parsing failed: ${message}`);
  }
};

// Multer configuration for file uploads
export const fileUploadMulter = multer({
  storage: multer.memoryStorage(),
  // dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const validMimeTypes = [
      'text/csv', // .csv
      'text/tab-separated-values', // .tsv
      'text/plain', // .txt
    ];
    cb(null, validMimeTypes.includes(file.mimetype));
  }
});

// UNUSED
export const parseBufferFileToHeadersArray = (fileBuffer: Buffer): string[] => {
  const workbook = xlsx.read(fileBuffer);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(firstSheet, { header: 1 })[0] as string[];
};

// UNUSED - kept for potential future use
// TODO: Add CSV/TSV support
export const parseHeadersFromFile = (fileBuffer: Buffer, filename: string): string[] => {
  if (filename.endsWith('.xlsx')) {
    return parseBufferFileToHeadersArray(fileBuffer);
  } else {
    // CSV/TSV
    const firstLine = fileBuffer.toString('utf8').split('\n')[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    return firstLine.split(delimiter).map(header => header.trim());
  }
};

/**
 * Generate QR as base64 PNG string
 */
export async function generateQrBase64(data: string): Promise<string> {
    const buffer = await QRCode.toBuffer(data, {
        type: "png",
        errorCorrectionLevel: "H",
        margin: 1,
        width: 200,
    });
    return `data:image/png;base64,${buffer.toString("base64")}`;
}

/**
 * Generate Barcode as base64 PNG string
 */
export async function generateBarcodeBase64(data: string): Promise<string> {
    const buffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: data,
        scale: 3,
        height: 10,
        includetext: false,
        backgroundcolor: "FFFFFF",
        paddingwidth: 0,
        paddingheight: 0,
    });
    return `data:image/png;base64,${buffer.toString("base64")}`;
}