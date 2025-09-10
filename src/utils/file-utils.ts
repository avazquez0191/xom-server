import xlsx from 'xlsx';

export const parseBufferFileToRawJSON = (buffer: Buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const orders = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return orders;
};

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