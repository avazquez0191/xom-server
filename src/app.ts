import express, { type Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mainRouter from './routes';

const app: Express = express();

// Middleware
app.use(morgan('combined'));
app.use(cors({ origin: 'http://ui:5173' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes (all handled by the router now)
app.use('/api', mainRouter);

// 404 Handler
app.use((req: Request, res: Response, next: any) => {
    if (!req.route) { // If no route matched
        res.status(404).json({
            message: 'Route not found',
            path: req.originalUrl
        });
    } else {
        next();
    }
});

// Error Handler
app.use((error: any, req: Request, res: Response, next: any) => {
    console.error('Error:', error);
    res.status(500).json({
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
});

export default app;