import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors({ origin: 'http://ui:5173' })); // Allow requests from your React app
app.use(express.json());                      // Parse JSON bodies

// Test route
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Export for use in index.js
export default app;