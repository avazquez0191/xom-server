import { Router } from 'express';
import { getOrdersCollection } from '../services/mongo.service';

const router = Router();

// GET /api/health
router.get('/', (req, res) => {
    res.json({ status: 'Server is running' });
});

// GET /api/db-health
router.get('/db', async (req, res) => {
    try {
        const collection = getOrdersCollection();
        await collection.findOne({});
        res.json({ status: 'healthy', db: collection.dbName });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'DB Connection failed',
            stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        });
    }
});

export default router;