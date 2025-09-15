import { Router } from 'express';
import healthRoute from './health.route';
import orderRoute from './order.route';
import batchRoute from './batch.route';

const router = Router();

// Mount routes

// Order
router.use('/order', orderRoute);

// Batch
router.use('/batch', batchRoute);

// Product

// Health
router.use('/health', healthRoute);

export default router;