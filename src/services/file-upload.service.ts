import { type Request } from 'express';
import { ObjectId } from 'mongodb';
import { getOrdersCollection } from './mongo.service';
import { parseOrderFile } from '../utils/file-utils';
import { generateBatchId } from '../utils/batch.util';
import OrderBase from '../models/Order';

export const processUpload = async (fileBuffer: Buffer) => {
    if (!fileBuffer) throw new Error('No file uploaded');

    try {
        const batch = generateBatchId();

        // Parse the uploaded file
        const rawOrders = parseOrderFile(fileBuffer);

        // Map to our Order interface
        const orders: OrderBase[] = rawOrders.map((raw: any) => {
            // Convert empty strings to undefined for optional fields
            const toOptional = (value: string | number) => {
                if (typeof value === 'string') {
                    return value.trim() || undefined;
                }
                return value !== null && value !== undefined ? value.toString() : undefined;
            };
            const toNumber = (value: string) => parseFloat(value) || 0;
            const toDate = (value: string) => value ? new Date(value) : new Date();

            return {
                orderId: raw['order id'],
                orderStatus: raw['order status'],
                logisticsServiceSuggestion: toOptional(raw['Logistics service suggestion']),
                orderItemId: raw['Order item ID'],
                orderItemStatus: raw['order item status'],
                product: {
                    name: raw['product name'],
                    nameByCustomer: toOptional(raw['product name by customer order']),
                    variation: raw['variation'],
                    skuId: raw['sku id'],
                    contributionSku: raw['contribution sku'],
                    quantityPurchased: toNumber(raw['quantity purchased']),
                    quantityShipped: toNumber(raw['quantity shipped']),
                    quantityToShip: toNumber(raw['quantity to ship'])
                },
                recipient: {
                    name: raw['recipient name'],
                    firstName: toOptional(raw['recipient first name']),
                    lastName: toOptional(raw['recipient last name']),
                    phone: raw['recipient phone number'],
                    email: raw['virtual email']
                },
                shipping: {
                    address: {
                        line1: raw['ship address 1'],
                        line2: toOptional(raw['ship address 2']),
                        line3: toOptional(raw['ship address 3']),
                        district: toOptional(raw['district']),
                        city: raw['ship city'],
                        state: raw['ship state'],
                        postalCode: raw['ship postal code (Must be shipped to the following zip code.)'],
                        country: raw['ship country']
                    },
                    label: {
                        trackingNumber: toOptional(raw['tracking number']),
                        trackingStatus: "",
                        carrier: toOptional(raw['carrier']),
                        cost: 0
                    },
                    latestShippingTime: toDate(raw['latest shipping time']),
                    latestDeliveryTime: toDate(raw['latest delivery time']),
                },
                financial: {
                    basePrice: toNumber(raw['activity goods base price']),
                    basePriceTotal: toNumber(raw['base price total']),
                    settlementStatus: raw['order settlement status']
                },
                metadata: {
                    platform: 'TEMU',
                    purchaseDate: toDate(raw['purchase date']),
                    iphoneSerial: toOptional(raw['iPhone serial number']),
                    requiresShipmentProof: raw['keep proof of shipment before delivery'] === 'YES'
                },
                batch: {
                    id: batch.id,
                    name: batch.name,
                    uploadedAt: new Date()
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
        });

        // Insert into MongoDB
        const result = await getOrdersCollection().insertMany(orders);

        return {
            success: true,
            insertedCount: result.insertedCount,
            firstOrder: orders[0] // For verification
        };

    } catch (error) {
        console.error('Upload processing failed:', error);
        throw error; // Let controller handle the response
    }
};