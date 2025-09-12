import { Router } from 'express';
import uploadRoutes from './order/upload.routes';
import downloadRoutes from './order/download.routes';
import healthRoutes from './health.routes';

const router = Router();

// Mount routes

// Order
router.use('/order/upload', uploadRoutes);
router.use('/order/download', downloadRoutes);

// Product

// Health
router.use('/health', healthRoutes);

export default router;