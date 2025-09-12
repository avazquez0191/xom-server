import { parse } from 'csv-parse/sync';
import xlsx from 'xlsx';

// General parser for Excel files like TEMU
export const parseBufferFileToRawJSON = (buffer: Buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const orders = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return orders;
};

// eBay-specific parser (CSV)
export const parseEbayFileBuffer = (fileBuffer: Buffer): Record<string, any>[] => {
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
  const content = fileBuffer.toString('utf8');
  const lines = content.split('\n').filter(line => line.trim().length > 0);

  const headers = lines[0].split('\t');
  const dataLines = lines.slice(1);

  return dataLines.map(line => {
    const values = line.split('\t');
    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
};

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