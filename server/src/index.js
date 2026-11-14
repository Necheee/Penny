import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import mediaRoutes from './routes/media.js';
import paymentRoutes from './routes/payments.js';
import contactRoutes from './routes/contact.js';
import { initCloudDatabase } from './utils/cloudDb.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables explicitly from server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect & synchronize Neon Cloud Database
initCloudDatabase().catch(err => console.warn('Cloud DB init notice:', err.message));

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security Headers & Cross-Origin Policies
app.use(helmet());
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsing Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'PENNY API',
  });
});

// Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/media', mediaRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);

// 404 Handler for Unmatched API Endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' does not exist on this server.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  PENNY Backend Service running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Client Origin: ${CLIENT_URL}`);
  console.log(`===============================================`);
});

export default app;

