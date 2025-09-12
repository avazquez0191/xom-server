import { Router } from 'express';
import { downloadLabels } from '@controllers/order/upload.controller';

const router = Router();

router.get('/labels/:filename', downloadLabels);

export default router;