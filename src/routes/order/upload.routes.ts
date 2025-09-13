import { Router } from 'express';
import multer from 'multer';
import { uploadOrders } from '@controllers/order/upload.controller';

const router = Router();

// Multer configuration
const upload = multer({
    storage: multer.memoryStorage(),
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
router.post('/', upload.single('file'), (req, res, next) => {
    uploadOrders(req, res).catch(next);
});

export default router;