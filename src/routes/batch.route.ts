import { Router } from 'express';
import { BatchController } from '@controllers/batch.controller';
import { OrderController } from '@controllers/order.controller';

const router = Router();

router.get('/', BatchController.list); // GET /api/batch
router.get('/:batchId/orders', OrderController.listByBatch); // GET /api/batch/:batchId/orders
router.get('/:batchId/orders/:orderId', OrderController.getOne); // GET /api/batch/:batchId/orders/:orderId

export default router;
