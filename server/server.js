const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const seoRoutes = require('./routes/seoRoutes');
const { helmetMiddleware, generalApiLimiter, corsOptionsDelegate, ipAllowlistMiddleware, adminSecurityHeaders } = require('./middleware/security');
const repo = require('./storage');
const baileysManager = require('./services/baileysService');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cellfocus';

// Enable trust proxy for Nginx / Cloudflare real IP restoration
app.set('trust proxy', 1);

// Security & Base Middlewares
app.use(helmetMiddleware);
app.use(cors(corsOptionsDelegate));
app.use(generalApiLimiter);

// Secured Body-Parser (Standard limit 2MB to prevent memory exhaustion DoS)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// Handle JSON syntax parsing errors cleanly
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload received.',
    });
  }
  next(err);
});

// Primary API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', ipAllowlistMiddleware, adminSecurityHeaders, adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/', seoRoutes);

// Public Currency Exchange Rates (Base: PKR)
app.get('/api/rates', (req, res) => {
  try {
    const ratesPath = path.join(__dirname, 'data', 'rates.json');
    if (fs.existsSync(ratesPath)) {
      const data = JSON.parse(fs.readFileSync(ratesPath, 'utf8'));
      return res.json({ success: true, ...data });
    }
  } catch (e) {
    console.warn('Error reading rates.json:', e);
  }
  res.json({
    success: true,
    base: 'PKR',
    rates: { PKR: 1, USD: 278.5, AED: 75.8, SAR: 74.2 },
    updatedAt: new Date().toISOString(),
  });
});

// Production Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: repo.useMongo ? 'MongoDB Atlas / Local' : 'Embedded JSON Persistence',
  });
});

// Root API info (only when frontend bundle is not co-located)
const CLIENT_DIST_DIR = path.join(__dirname, '..', 'client', 'dist');
const CLIENT_INDEX_HTML = path.join(CLIENT_DIST_DIR, 'index.html');

if (!fs.existsSync(CLIENT_INDEX_HTML)) {
  app.get('/', (req, res) => {
    res.json({
      app: 'CellFocus eCommerce API',
      status: 'healthy',
      version: '1.0.0',
      endpoints: {
        products: '/api/products',
        orders: '/api/orders',
        reviews: '/api/reviews',
        health: '/api/health',
        sitemap: '/sitemap.xml',
        robots: '/robots.txt',
      },
    });
  });
}

// 404 Handler for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' does not exist.`,
  });
});

// Serve built Vite SPA frontend when co-deployed with backend (Hostinger Node.js Web App / VPS)
if (fs.existsSync(CLIENT_INDEX_HTML)) {
  app.use(express.static(CLIENT_DIST_DIR, { maxAge: '7d', index: false }));

  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }
    if (/^\/(cf-)?admin(\/|$)/i.test(req.path) || req.query.admin !== undefined) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
    return res.sendFile(CLIENT_INDEX_HTML);
  });
}

// Centralized Production Error Handler (Prevent stack trace leakage)
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);

  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? 'An internal server error occurred.' : (err.message || 'Internal Server Error'),
    ...(isProd ? {} : { stack: err.stack }),
  });
});

// Graceful MongoDB connection attempt with production pooling
async function startServer() {
  try {
    console.log('[Database] Connecting to MongoDB with production pooling...');
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
      socketTimeoutMS: 45000,
    });
    console.log('✓ [Database] Connected to MongoDB successfully.');
    repo.setMongoActive(true);
  } catch (err) {
    console.log('ℹ [Database] MongoDB is offline or not configured.');
    console.log('✓ [Database] Seamlessly activated high-performance Embedded JSON Engine.');
    repo.setMongoActive(false);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 [Server] CellFocus API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    // Initialize Baileys Multi-Device WhatsApp Bot
    baileysManager.init();
  });

  // Graceful shutdown handling for PM2 and process monitors
  const handleShutdown = async (signal) => {
    console.log(`\n[Process] Received ${signal}. Initiating graceful shutdown...`);
    try {
      await baileysManager.shutdown();
      console.log('[Baileys] WhatsApp socket and worker lock closed cleanly.');
    } catch (e) {
      console.error('[Baileys] Error during shutdown:', e);
    }
    server.close(async () => {
      console.log('[Server] HTTP connections closed.');
      try {
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close();
          console.log('[Database] MongoDB connection closed.');
        }
      } catch (e) {
        console.error('[Database] Error closing MongoDB connection:', e);
      }
      process.exit(0);
    });

    // Force exit if connections take too long to close
    setTimeout(() => {
      console.error('[Process] Forcefully terminating after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

// Global Process Exception & Rejection Handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process Error] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process Error] Uncaught Exception:', err);
  // Log and give PM2 chance to restart the worker cleanly
});

startServer();
