import config from './config/config';
import { connectDB } from './services/mongo.service';
import app from './app';

// Initialize database before starting server
async function startServer() {
  try {
    await connectDB(); // <-- Add this line
    console.log('✅ Database connected');

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

startServer();