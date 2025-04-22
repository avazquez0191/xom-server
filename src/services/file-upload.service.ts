import { type Request } from 'express';
import fs from 'fs';
import path from 'path';
import { parseOrderFile } from '../utils/file-utils.ts';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current module path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const processUpload = async (req: Request) => {
    if (!req.file) throw new Error('No file uploaded');

    // Ensure your uploads directory exists
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(__dirname, '../../uploads', req.file.filename);
    const orders = parseOrderFile(filePath);

    // Clean up temp file
    fs.unlinkSync(filePath);

    return {
        count: orders.length,
        orders, // Raw order data (to be formatted later)
    };
};