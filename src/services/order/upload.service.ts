import { getOrdersCollection } from '@services/mongo.service';
import { detectPlatformByFilename, getPlatformMapper } from '@platforms/resolver';
import OrderBase from '@models/Order';

export const processOrderUpload = async (fileBuffer: Buffer, originalFilename: string): Promise<{
    success: boolean;
    insertedCount: number;
    orders: OrderBase[];
}> => {
    if (!fileBuffer) throw new Error('No file uploaded');

    try {
        console.log('🔍 Detecting platform for file:', originalFilename);
        
        // 1. Detect platform
        const platform = detectPlatformByFilename(originalFilename);
        if (!platform) {
            throw new Error('Unsupported platform');
        }
        console.log('🏷️ Platform detected:', platform);

        // 2. Get appropriate mapper
        const mapper = getPlatformMapper(platform);
        if (!mapper) {
            throw new Error(`No mapper found for platform: ${platform}`);
        }

        // 3. Process file with detected mapper
        const results: OrderBase[] = await mapper.process(fileBuffer);
        if (results.length === 0) {
            throw new Error('No valid orders found in the file');
        }
        console.log('✅ Mapper processed', results.length, 'orders');

        // 4. Insert into MongoDB
        const result = await getOrdersCollection().insertMany(results);
        if (!result) {
            throw new Error('Failed to insert orders into the database');
        }
        console.log('💾 Inserted', result.insertedCount, 'orders into database');

        return {
            success: true,
            insertedCount: result.insertedCount,
            orders: results
        };
    } catch (error) {
        console.error('❌ Upload processing failed:', error instanceof Error ? error.message : error);
        throw error; // Let controller handle the response
    }
};