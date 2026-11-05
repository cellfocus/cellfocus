const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { helmetMiddleware, generalApiLimiter } = require('./middleware/security');
const repo = require('./storage');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cellfocus';

// Enable trust proxy for Cloudflare / Nginx real IP restoration
app.set('trust proxy', 1);

// Security & Base Middlewares
app.use(helmetMiddleware);
app.use(cors());
app.use(generalApiLimiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: repo.useMongo ? 'MongoDB Atlas / Local' : 'Embedded JSON Persistence',
  });
});

// Root info
app.get('/', (req, res) => {
  res.json({
    app: 'CellFocus eCommerce API',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      orders: '/api/orders',
      health: '/api/health',
    },
  });
});

// Graceful MongoDB connection attempt
async function startServer() {
  try {
    console.log('[Database] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('✓ [Database] Connected to MongoDB successfully.');
    repo.setMongoActive(true);
  } catch (err) {
    console.log('ℹ [Database] MongoDB is offline or not configured.');
    console.log('✓ [Database] Seamlessly activated high-performance Embedded JSON Engine.');
    repo.setMongoActive(false);
  }

  app.listen(PORT, () => {
    console.log(`🚀 [Server] CellFocus API running at http://localhost:${PORT}`);
  });
}

startServer();
