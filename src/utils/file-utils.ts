import xlsx from 'xlsx';

export const parseOrderFile = (filePath: string) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const orders = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return orders; // Array of { 'Order ID': '123', 'Product': '...', ... }
};