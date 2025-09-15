import mongoose from 'mongoose';
import config from '@config/config';

export async function connectDB() {
    try {
        await mongoose.connect(config.mongoURI, {
            maxPoolSize: 50,
            serverSelectionTimeoutMS: 3000,
        });

        console.log('✅ MongoDB connected via Mongoose');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    await mongoose.connection.close();
});