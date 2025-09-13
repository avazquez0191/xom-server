import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import OrderBase from '@models/Order';
import { Response } from 'express';

export class ShippingLabelService {
    static async generateAndSaveBulkLabels(orders: OrderBase[]): Promise<string> {
        const doc = new PDFDocument({ 
            size: [288, 432],
            margins: { top: 0, left: 0, right: 0, bottom: 0 }
        });
        
        const filename = `shipping-labels-${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '../../public/labels', filename);
        
        // Ensure storage directory exists
        const storageDir = path.dirname(filePath);
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }
        
        // Create write stream to file
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);
        
        // Generate labels
        orders.forEach((order, index) => {
            if (index > 0) doc.addPage();
            this.addLabelContent(doc, order);
        });
        
        // Return promise that resolves when PDF is written
        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => resolve(filename));
            writeStream.on('error', reject);
            doc.end();
        });
    }

    static serveSavedLabel(filename: string, res: Response): void {
        const filePath = path.join(__dirname, '../../public/labels', filename);
        
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': fs.statSync(filePath).size
        });
        
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    }

    // Optional: Clean up old files
    static cleanupOldFiles(maxAgeHours: number = 24): void {
        const storageDir = path.join(__dirname, '../../public/labels');
        if (!fs.existsSync(storageDir)) return;
        
        const files = fs.readdirSync(storageDir);
        const now = Date.now();
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
        
        files.forEach(file => {
            const filePath = path.join(storageDir, file);
            const stats = fs.statSync(filePath);
            
            if (now - stats.mtimeMs > maxAgeMs) {
                fs.unlinkSync(filePath);
            }
        });
    }

    private static addLabelContent(doc: PDFKit.PDFDocument, order: OrderBase): void {
        const margin = 10; // Small margin for readability
        
        // Order info header
        doc.fontSize(8)
           .text(`Order: ${order.orderId} | ${new Date().toLocaleDateString()}`, margin, margin);
        
        // Horizontal line separator
        doc.moveTo(margin, 20).lineTo(278, 20).stroke();
        
        // Shipping address
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(order.recipient.name, margin, 30);
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(order.shipping.address.line1, margin, 50);
        
        if (order.shipping.address.line2) {
            doc.text(order.shipping.address.line2, margin, 65);
        }
        
        const cityStateY = order.shipping.address.line2 ? 80 : 65;
        doc.text(
            `${order.shipping.address.city}, ${order.shipping.address.state} ${order.shipping.address.zip}`,
            margin, cityStateY
        );
        
        doc.text(order.shipping.address.country, margin, cityStateY + 15);
        
        // Tracking info (if available)
        if (order.shipping.label?.trackingNumber) {
            doc.moveTo(margin, 120).lineTo(278, 120).stroke();
            
            doc.fontSize(9)
               .text(`Tracking: ${order.shipping.label.trackingNumber}`, margin, 130);
            
            if (order.shipping.label.carrier) {
                doc.text(`Carrier: ${order.shipping.label.carrier}`, margin, 145);
            }
        }
        
        // Platform info footer
        doc.fontSize(7)
           .text(`Platform: ${order.metadata.platform}`, margin, 400);
    }
}