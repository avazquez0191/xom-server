import { Router } from 'express';
import multer from 'multer';
import { OrderController } from '@controllers/order.controller';

const router = Router();

// Multer configuration
const upload = multer({
    storage: multer.memoryStorage(),
    // dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const validMimeTypes = [
            'text/csv', // .csv
            'text/tab-separated-values', // .tsv
            'text/plain', // .txt
        ];
        cb(null, validMimeTypes.includes(file.mimetype));
    }
});

// POST /api/upload
router.post('/upload/', upload.array('files'), (req, res, next) => {
    OrderController.importOrders(req, res).catch(next);
});

// GET /api/download/label/:filename
router.get('/download/labels/:filename', OrderController.exportOrderLabels);

export default router;