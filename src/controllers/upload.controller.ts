import { type Request, type Response } from 'express';
import { processUpload } from '../services/file-upload.service.ts';

export const uploadOrders = async (req: Request, res: Response) => {
    try {
        const result = await processUpload(req);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Upload failed'
        });
    }
};