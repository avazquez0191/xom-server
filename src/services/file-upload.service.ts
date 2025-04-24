import { type Request } from 'express';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import { getOrdersCollection } from './mongo.service';
import { parseOrderFile } from '../utils/file-utils';
import Order from '../models/Order';

export const processUpload = async (req: Request) => {
    if (!req.file) throw new Error('No file uploaded');

    try {
        // Parse the uploaded file
        const rawOrders = parseOrderFile(req.file.path);

        console.log('Parsed Orders:', rawOrders); // Debugging line

        // Map to our Order interface
        const orders: Order[] = rawOrders.map((raw: any) => {
            // Convert empty strings to undefined for optional fields
            const toOptional = (value: string) => {return value?.trim()|| undefined};
            const toNumber = (value: string) => parseFloat(value) || 0;
            const toDate = (value: string) => value ? new Date(value) : new Date();

            return {
                orderId: raw['order id'],
                orderStatus: raw['order status'],
                logisticsServiceSuggestion: toOptional(raw['Logistics service suggestion']),
                orderItemId: raw['Order item ID'],
                orderItemStatus: raw['order item status'],
                productNameByCustomer: raw['product name by customer order'],
                productName: raw['product name'],
                variation: toOptional(raw['variation']),
                contributionSku: toOptional(raw['contribution sku']),
                skuId: raw['sku id'],
                quantityPurchased: toNumber(raw['quantity purchased']),
                quantityShipped: toNumber(raw['quantity shipped']),
                quantityToShip: toNumber(raw['quantity to ship']),
                recipient: {
                    name: raw['recipient name'],
                    firstName: raw['recipient first name'],
                    lastName: raw['recipient last name'],
                    phone: raw['recipient phone number']
                },
                shipping: {
                    address: {
                        line1: raw['ship address 1'],
                        line2: toOptional(raw['ship address 2']),
                        line3: toOptional(raw['ship address 3']),
                        district: raw['district'],
                        city: raw['ship city'],
                        state: raw['ship state'],
                        postalCode: raw['ship postal code (Must be shipped to the following zip code.)'],
                        country: raw['ship country']
                    },
                    latestShippingTime: toDate(raw['latest shipping time']),
                    latestDeliveryTime: toDate(raw['latest delivery time']),
                    trackingNumber: toOptional(raw['tracking number']),
                    carrier: toOptional(raw['carrier'])
                },
                financial: {
                    basePrice: toNumber(raw['activity goods base price']),
                    basePriceTotal: toNumber(raw['base price total']),
                    settlementStatus: raw['order settlement status']
                },
                metadata: {
                    purchaseDate: toDate(raw['purchase date']),
                    iphoneSerial: toOptional(raw['iPhone serial number']),
                    virtualEmail: toOptional(raw['virtual email']),
                    requiresShipmentProof: raw['keep proof of shipment before delivery'] === 'YES'
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
        });

        console.log('Mapped orders:', orders);

        // Insert into MongoDB
        const result = await getOrdersCollection().insertMany(orders);

        // Cleanup uploaded file
        fs.unlinkSync(req.file.path);

        return {
            success: true,
            insertedCount: result.insertedCount,
            firstOrder: orders[0] // For verification
        };

    } catch (error) {
        // Ensure file cleanup even on error
        if (req.file?.path) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        throw error;
    }
};

// interface Order {
//   _id?: ObjectId;
//   orderId: string;
//   orderStatus: string;
//   logisticsServiceSuggestion?: string;
//   orderItemId: string;
//   orderItemStatus: string;
//   productNameByCustomer: string;
//   productName: string;
//   variation?: string;
//   contributionSku?: string;
//   skuId: string;
//   quantityPurchased: number;
//   quantityShipped: number;
//   quantityToShip: number;
//   recipient: {
//     name: string;
//     firstName: string;
//     lastName: string;
//     phone: string;
//   };
//   shipping: {
//     address: {
//       line1: string;
//       line2?: string;
//       line3?: string;
//       district: string;
//       city: string;
//       state: string;
//       postalCode: string;
//       country: string;
//     };
//     latestShippingTime: Date;
//     latestDeliveryTime: Date;
//     trackingNumber?: string;
//     carrier?: string;
//   };
//   financial: {
//     basePrice: number;
//     basePriceTotal: number;
//     settlementStatus: string;
//   };
//   metadata: {
//     purchaseDate: Date;
//     iphoneSerial?: string;
//     virtualEmail?: string;
//     requiresShipmentProof: boolean;
//   };
//   createdAt: Date;
//   updatedAt: Date;
// }