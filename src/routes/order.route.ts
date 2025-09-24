import { Router } from 'express';
import { OrderController } from '@controllers/order.controller';

const router = Router();

router.post("/manual-label", OrderController.create);

export default router;