import { Router } from 'express';
import { BatchController } from '@controllers/batch.controller';
import { fileUploadMulter } from '@utils/file.utils';

const router = Router();

router.get('/', BatchController.list); // GET /api/batch
router.get('/:batchId/orders', BatchController.listByBatch); // GET /api/batch/:batchId/orders
router.get('/:batchId/orders/:orderId', BatchController.getOne); // GET /api/batch/:batchId/orders/:orderId
router.get('/:batchId/labels/print', (req, res, next) => {
    BatchController.printOrderLabels(req, res).catch(next);
}); // GET /api/batch/:batchId/labels/print
router.get('/:batchId/labels/:filename', BatchController.exportOrderLabels); // GET /api/batch/:batchId/labels/:filename
router.get('/:batchId/export/shipping-confirmation', BatchController.exportShippingConfirmations); // GET /api/batch/:batchId/export/shipping-confirmation
router.get('/:batchId/export/accounting', BatchController.exportAccounting); // GET /api/batch/:batchId/export/accounting


router.post('/orders', fileUploadMulter.array('files'), (req, res, next) => {
    BatchController.importOrders(req, res).catch(next);
}); // POST /api/batch/orders
router.post('/:batchId/orders/confirm', (req, res, next) => {
    BatchController.confirmShipping(req, res).catch(next);
}); // POST /api/batch/:batchId/orders/confirm

// POST /api/batch/:batchId/orders/:orderId/packages - Assign packages for a single order in a batch
router.post('/:batchId/orders/:orderId/packages', BatchController.assignPackages);

// POST /api/batch/:batchId/orders/packages - Assign packages for multiple orders in a batch
router.post('/:batchId/orders/packages', BatchController.assignPackagesForBatch);

export default router;
