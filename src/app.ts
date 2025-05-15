import express, { type Express } from 'express';
import cors from 'cors';
import multer from 'multer';
import { uploadOrders } from './controllers/upload.controller';
import { getOrdersCollection } from './services/mongo.service';

const app: Express = express();

// Middleware
app.use(cors({ origin: 'http://ui:5173' }));
app.use(express.json());

// Multer config
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const validMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'text/csv', // .csv
            'text/tab-separated-values' // .tsv
        ];
        cb(null, validMimeTypes.includes(file.mimetype));
    }
});

// Routes
app.post('/api/upload', upload.single('file'), (req, res, next) => {
    uploadOrders(req, res).catch(next);
});

// Healthy test routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

app.get('/api/db-health', async (req, res) => {
    try {
        const collection = getOrdersCollection();
        await collection.findOne({});
        res.json({ status: 'healthy', db: collection.dbName });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'DB Connection failed',
            stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        });
    }
});

export default app;