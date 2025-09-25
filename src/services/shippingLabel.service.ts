import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { generateQrBase64, generateBarcodeBase64 } from "@utils/file.utils";
import { OrderBase, ShippingLabel } from '@models/order.model';
import { Response } from 'express';

interface ManualLabelData {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
}

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
        let firstPage = true;
        for (const order of orders) {
            if (!order.shipping?.packages?.length) continue;

            for (const pkg of order.shipping.packages) {
                if (!firstPage) doc.addPage();
                await this.addLabelContent(doc, order, pkg);
                firstPage = false;
            }
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

    private static async addLabelContent(
        doc: PDFKit.PDFDocument,
        order: OrderBase,
        pkg: { label: ShippingLabel; products: { sku: string; quantity: number }[] }
    ): Promise<void> {
        const margin = 5;
        const marginBody = 10;
        const pageWidth = 280;
        const pageHeight = 425;

        // --- Border lines (edges of label) ---
        doc.rect(2, 2, pageWidth, pageHeight).stroke();

        // --- QR Code (left) ---
        const qrBase64 = await generateQrBase64(order.orderId);
        doc.image(qrBase64, margin, margin, { width: 50, height: 50 });

        // --- Barcode (right) ---
        const barcodeBase64 = await generateBarcodeBase64(order.orderId);
        doc.image(barcodeBase64, 65, margin, { width: 210, height: 50 });

        // --- Order ID label ---
        doc.fontSize(8).font("Helvetica").text(`Order ID: ${order.orderId}`, 80, 60);

        // --- Line below QR/Barcode section ---
        doc.moveTo(5, 70).lineTo(pageWidth, 70).stroke();

        // --- Product Info (from package only) ---
        if (pkg.products?.length) {
            const keep = 30; // Fixed number of characters to keep at start and end
            const ellipsis = '...';

            const formatProductName = (name: string): string => {
                if (name.length <= keep * 2 + ellipsis.length) return name;
                return name.slice(0, keep) + ellipsis + name.slice(-keep);
            };

            let y = 75;
            pkg.products
                .filter(sp => sp.quantity > 0)
                .forEach(sp => {
                    const original = order.products.find(p => p.sku === sp.sku);
                    const name = original ? original.name : sp.sku;
                    const shortName = formatProductName(name);
                    doc.fontSize(8)
                        .font("Helvetica")
                        .text(`[${shortName} x${sp.quantity}]`, marginBody, y, {
                            width: pageWidth - 2 * marginBody,
                            ellipsis: true,
                        });
                    y += 11;
                });
        }

        let y = 130;
        // --- Return Address placeholder ---
        doc.fontSize(9).font("Helvetica").text("JML CONNECTION INC", margin + 5, y);
        doc.text("5680 NW 163RD ST", margin + 5, y + 10);
        doc.text("MIAMI LAKES FL 33014-6134", margin + 5, y + 20);
        y += 65;

        //Adding extra space if line2 or line3 don't exist
        if (!order.shipping.address.line2) {
            y += 11;
        }
        if (!order.shipping.address.line3) {
            y += 11;
        }

        // --- Shipping Address ---
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
        doc.moveTo(5, 270).lineTo(pageWidth, 270).stroke();

        doc.fontSize(12)
            .font("Helvetica-Bold")
            .text("USPS TRACKING #", 0, 280, {
                align: "center",
                width: pageWidth,
            });

        // Barcode (bottom-right)
        if (pkg.label?.trackingNumber) {
            const barcodeBase64 = await generateBarcodeBase64(pkg.label.trackingNumber);
            doc.image(barcodeBase64, 15, 300, { width: 255, height: 70 });
            doc.fontSize(11)
                .font("Helvetica-Bold")
                .text(`${pkg.label.trackingNumber}`, 15, 380, {
                    align: "center",
                    width: 260,
                });
        }

        const bottomLineY = pageHeight - 20;
        doc.moveTo(5, bottomLineY).lineTo(pageWidth, bottomLineY).stroke();

        // Order Reference Number (bottom-left)
        doc.fontSize(8)
            .font("Helvetica")
            .text(`Ref: ${order.orderReferenceNumber}`, marginBody, bottomLineY + 5, {
                align: "left",
                width: pageWidth / 2,
            });
    }

    static async generate(data: ManualLabelData): Promise<string> {
        const doc = new PDFDocument({
            size: [288, 432],
            margins: { top: 0, left: 0, right: 0, bottom: 0 },
        });

        const filename = `manual-${Date.now()}.pdf`;
        const filePath = path.join(__dirname, "../../public/labels", filename);

        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const margin = 10;
        const pageWidth = 288;
        const pageHeight = 432;

        // --- Border ---
        doc.rect(0, 0, pageWidth, pageHeight).stroke();

        // --- USPS text instead of QR/Barcode ---
        doc.fontSize(20).font("Helvetica-Bold").text("USPS", margin, 20, {
            width: pageWidth - 2 * margin,
            align: "left",
        });

        // --- Line ---
        doc.moveTo(margin, 60).lineTo(pageWidth - margin, 60).stroke();

        // --- Return Address placeholder ---
        doc.fontSize(9).font("Helvetica").text("JML CONNECTION INC", margin + 5, 70);
        doc.text("5680 NW 163RD ST", margin + 5, 80);
        doc.text("MIAMI LAKES FL 33014-6134", margin + 5, 90);

        // --- Ship To ---
        let y = 180;
        doc.fontSize(9).font("Helvetica-Bold").text("SHIP TO:", margin + 5, y);
        y += 10;

        doc.fontSize(11).font("Helvetica").text(data.name.toUpperCase(), margin + 15, y); y += 13;
        if (data.address2) { doc.text(data.address2.toUpperCase(), margin + 15, y); y += 13; }
        doc.text(data.address1.toUpperCase(), margin + 15, y); y += 13;
        doc.text(`${data.city.toUpperCase()} ${data.state.toUpperCase()} ${data.zip}`, margin + 15, y);

        // --- Footer ---
        doc.moveTo(margin, 260).lineTo(pageWidth - margin, 260).stroke();

        doc.fontSize(12)
            .font("Helvetica-Bold")
            .text("USPS TRACKING #", 0, 270, {
                align: "center",
                width: pageWidth,
            });

        const bottomLineY = pageHeight - 30;
        doc.moveTo(margin, bottomLineY).lineTo(pageWidth - margin, bottomLineY).stroke();

        return new Promise((resolve, reject) => {
            stream.on("finish", () => resolve(filename));
            stream.on("error", reject);
            doc.end();
        });
    }
}