import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { generateQrBase64, generateBarcodeBase64 } from "@utils/file.utils";
import { OrderBase } from '@models/order.model';
import { Response } from 'express';

export class ShippingLabelService {
    static async generateAndSaveBulkLabels(orders: OrderBase[]): Promise<string> {
        const doc = new PDFDocument({
            size: [288, 432],
            margins: { top: 0, left: 0, right: 0, bottom: 0 },
        });

        // get the minimum and maximum order.orderReferenceNumber
        const orderReferenceNumbers = orders.map(order =>
            order.orderReferenceNumber ? +order.orderReferenceNumber : 0
        );
        const minRef = Math.min(...orderReferenceNumbers);
        const maxRef = Math.max(...orderReferenceNumbers);

        const filename = `${minRef}-${maxRef} Labels.pdf`;
        const filePath = path.join(__dirname, "../../public/labels", filename);

        // Ensure storage directory exists
        const storageDir = path.dirname(filePath);
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }

        // Create write stream to file
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Generate labels sequentially
        for (let index = 0; index < orders.length; index++) {
            if (index > 0) doc.addPage();
            await this.addLabelContent(doc, orders[index]);
        }

        // Return promise that resolves when PDF is written
        return new Promise((resolve, reject) => {
            writeStream.on("finish", () => resolve(filename));
            writeStream.on("error", reject);
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

    private static async addLabelContent(doc: PDFKit.PDFDocument, order: OrderBase): Promise<void> {
        const margin = 5;
        const marginBody = 10;
        const pageWidth = 288;
        const pageHeight = 432;

        // --- Border lines (edges of label) ---
        doc.rect(0, 0, pageWidth, pageHeight).stroke();

        // --- QR Code (left) ---
        const qrBase64 = await generateQrBase64(order.orderId);
        doc.image(qrBase64, margin, margin, { width: 50, height: 50 });

        // --- Barcode (right) ---
        const barcodeBase64 = await generateBarcodeBase64(order.orderId);
        doc.image(barcodeBase64, 70, margin, { width: 210, height: 50 });

        // --- Order ID label ---
        doc.fontSize(8).font("Helvetica").text(`Order ID: ${order.orderId}`, 80, 65);

        // --- Line below QR/Barcode section ---
        doc.moveTo(margin, 80).lineTo(pageWidth - margin, 80).stroke();

        // --- Product Info (small font) ---
        if (order.products?.length) {
            const productNames = order.products
                .map(p => `**[${p.name} x${p.quantityPurchased}]  `)
                .join(' ');
            doc.fontSize(8).font("Helvetica").text(productNames, marginBody, 90);
        }

        // --- Shipping Address (more space + smaller font) ---
        let y = 180; // more space before address
        doc.fontSize(9).font("Helvetica").text("SHIP TO:", marginBody, y);
        y += 13;

        doc.fontSize(11).font("Helvetica").text(order.recipient.name.toUpperCase(), marginBody + 5, y);
        y += 11;

        if (order.shipping.address.line3) {
            doc.text(order.shipping.address.line3.toUpperCase(), marginBody + 5, y);
            y += 11;
        }

        if (order.shipping.address.line2) {
            doc.text(order.shipping.address.line2.toUpperCase(), marginBody + 5, y);
            y += 11;
        }

        doc.font("Helvetica").text(order.shipping.address.line1.toUpperCase(), marginBody + 5, y);
        y += 11;

        doc.text(
            `${order.shipping.address.city.toUpperCase()} ${order.shipping.address.state.toUpperCase()} ${order.shipping.address.zip}`,
            marginBody + 5,
            y
        );
        y += 11;

        // --- Footer ---
        // Line above USPS Tracking
        doc.moveTo(margin, 260).lineTo(pageWidth - margin, 260).stroke();

        // Centered USPS Tracking text
        doc.fontSize(12)
            .font("Helvetica-Bold")
            .text("USPS TRACKING #", 0, 270, {
                align: "center",
                width: pageWidth,
            });

        // --- Bottom footer line ---
        const bottomLineY = pageHeight - 30;
        doc.moveTo(margin, bottomLineY).lineTo(pageWidth - margin, bottomLineY).stroke();

        // --- Order Reference Number (bottom-left area) ---
        doc.fontSize(8)
            .font("Helvetica")
            .text(`Ref: ${order.orderReferenceNumber}`, marginBody, bottomLineY + 5, {
                align: "left",
                width: pageWidth / 2,
            });
    }
}