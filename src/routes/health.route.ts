import { Router } from 'express';
import mongoose from 'mongoose';
import { OrderModel } from '@schemas/order.schema';

const router = Router();

// GET /api/health
router.get('/', (req, res) => {
    res.json({ status: 'Server is running' });
});

// GET /api/db-health
router.get('/db', async (req, res) => {
    try {
        // Check mongoose connection
        const connState = mongoose.connection.readyState;
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        if (connState !== 1) {
            throw new Error('Mongoose is not connected');
        }

        // Optional: run a lightweight query to ensure DB responds
        await OrderModel.findOne().lean().exec();

        res.json({
            status: 'healthy',
            db: mongoose.connection.name,
            state: 'connected',
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'DB Connection failed',
            stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
        });
    }
});

export default router;
