import { Router } from 'express';
import uploadRoutes from './order/upload.routes';
import healthRoutes from './health.routes';

const router = Router();

// Mount routes

// Order
router.use('/order/upload', uploadRoutes);

// Product

// Health
router.use('/health', healthRoutes);

export default router;