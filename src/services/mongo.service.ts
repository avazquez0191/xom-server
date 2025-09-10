import { MongoClient, Collection, Db } from 'mongodb';
import config from '../config/config';

if (!config.mongoUser || !config.mongoPassword || !config.mongoHost || !config.mongoDB) {
    throw new Error('Missing required environment variables for MongoDB connection');
}

const COLLECTION_NAME = 'orders';
const MONGO_URI = config.mongoURI;

let client: MongoClient;
let db: Db;
let ordersCollection: Collection;

export async function connectDB() {
    try {
        client = new MongoClient(MONGO_URI, {
            maxPoolSize: 50,  // Optimal for 100k+ records
            wtimeoutMS: 2500,
            socketTimeoutMS: 5000,
            retryWrites: true,
            retryReads: true,
            serverSelectionTimeoutMS: 3000,  // Fail fast if no connection
            heartbeatFrequencyMS: 10000      // Keep connection alive
        });

        await client.connect();
        // Verify connection
        await client.db().command({ ping: 1 });

        db = client.db();
        ordersCollection = db.collection(COLLECTION_NAME);

        await createIndexes();
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);  // Container restart will trigger
    }
}

async function createIndexes() {
    await ordersCollection.createIndexes([
        {
            key: {
                "orderId": 1,
                "orderItemId": 1,
                "recipient.name": 1,
                "orderReferenceNumber": 1
            },
            unique: true,
            partialFilterExpression: {
                "orderReferenceNumber": { $exists: true, $type: 'string' }
            }
        },
        { key: { "recipient.phone": 1 } },
        { key: { "shipping.trackingNumber": 1 } },
        { key: { "metadata.purchaseDate": -1 } },
        {
            key: {
                "product.name": "text",
                "product.nameByCustomer": "text",
                "recipient.name": "text"
            },
            weights: {
                "product.name": 3,
                "product.nameByCustomer": 2
            }
        }
    ]);
}

export function getOrdersCollection(): Collection {
    if (!ordersCollection) throw new Error('DB not initialized');
    return ordersCollection;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    await client?.close(true);  // Force close with 5s timeout
});