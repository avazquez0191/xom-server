import { Router } from 'express';
import { BatchController } from '@controllers/batch.controller';
import { fileUploadMulter } from '@utils/file.utils';

const router = Router();

router.get('/', BatchController.list); // GET /api/batch
router.get('/:batchId/orders', BatchController.listByBatch); // GET /api/batch/:batchId/orders
router.get('/:batchId/orders/:orderId', BatchController.getOne); // GET /api/batch/:batchId/orders/:orderId
router.get('/:batchId/labels/:filename', BatchController.exportOrderLabels); // GET /api/batch/:batchId/labels/:filename


router.post('/orders', fileUploadMulter.array('files'), (req, res, next) => {
    BatchController.importOrders(req, res).catch(next);
}); // POST /api/batch/orders
router.post('/:batchId/orders/confirm', (req, res, next) => {
    BatchController.shippingConfirmation(req, res).catch(next);
}); // POST /api/batch/:batchId/orders/confirm

export default router;
