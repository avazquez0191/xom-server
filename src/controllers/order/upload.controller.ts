import { type Request, type Response } from 'express';
import { processOrderUpload } from '@services/order/upload.service';
import { ShippingLabelService } from '@services/order/shipping-label.service';

export const uploadOrders = async (req: Request, res: Response) => {
    try {
        console.log('📤 Upload started - File:', req.file?.originalname);
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!req.body.platform) {
            return res.status(400).json({ error: 'No platform selected' });
        }

        const result = await processOrderUpload(req.file.buffer, req.body.platform);
        console.log('✅ File processed successfully:', result.orders.length, 'orders');

        // Generate and save PDF
        const filename = await ShippingLabelService.generateAndSaveBulkLabels(result.orders);
        console.log('💾 PDF saved as:', filename);
        
        // Return download URL instead of streaming
        res.json({
            success: true,
            message: 'Orders processed successfully',
            insertedCount: result.insertedCount,
            downloadUrl: `/api/order/download/labels/${filename}`,
            filename: filename
        });

    } catch (error) {
        console.error('❌ Upload failed:', error instanceof Error ? error.message : 'Unknown error');
        
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Upload failed',
            ...(process.env.NODE_ENV === 'development' && {
                stack: error instanceof Error ? error.stack : undefined
            })
        });
    }
};

// New endpoint to download saved PDFs
export const downloadLabels = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        ShippingLabelService.serveSavedLabel(filename, res);
    } catch (error) {
        res.status(500).json({ error: 'Download failed' });
    }
};