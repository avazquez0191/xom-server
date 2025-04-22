import express, { type Express } from 'express';
import cors from 'cors';
import multer from 'multer';
import { uploadOrders } from './controllers/upload.controller.ts';

const app: Express = express();

// Middleware
app.use(cors({ origin: 'http://ui:5173' }));
app.use(express.json());

// Multer config
const upload = multer({ dest: 'uploads/' });

// Routes
app.post('/api/upload', upload.single('file'), uploadOrders);

// Test route
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

export default app;