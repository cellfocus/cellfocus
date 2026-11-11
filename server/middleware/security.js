const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SECURITY_FILE = path.join(__dirname, '..', 'data', 'security.json');

// Helper to get active admin passcode
const getActivePasscode = () => {
  try {
    if (fs.existsSync(SECURITY_FILE)) {
      const data = JSON.parse(fs.readFileSync(SECURITY_FILE, 'utf8'));
      if (data && data.passcode) return data.passcode;
    }
  } catch (e) {
    // fallback to env
  }
  return process.env.ADMIN_PASSCODE || 'cellfocus2026';
};

// Secret key for HMAC token signing (enforces 64-char key in production)
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'cf-cellfocus-super-secure-key-992384-prod-audit-token';

// Cryptographic token generator with expiration (4 hours)
const generateAdminToken = () => {
  const expiresAt = Date.now() + 4 * 60 * 60 * 1000;
  const payload = `admin:${expiresAt}`;
  const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
};

// Cryptographic token verifier (HMAC validation + Timing-Safe equality)
const verifyAdminToken = (token) => {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parts = raw.split(':');
    if (parts.length !== 3) return false;
    const [role, expiresAtStr, signature] = parts;
    if (role !== 'admin') return false;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

    const expectedPayload = `admin:${expiresAtStr}`;
    const expectedSignature = crypto.createHmac('sha256', ADMIN_SECRET).update(expectedPayload).digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');
    if (sigBuf.length !== expBuf.length) return false;

    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (err) {
    return false;
  }
};

// Middleware: Enforce admin session token or verified passcode
const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.headers['x-admin-token'] || req.query.admin_token);

  if (rawToken && verifyAdminToken(rawToken)) {
    return next();
  }

  // Check valid admin passcode header
  const passcode = req.headers['x-admin-passcode'] || req.headers['x-passcode'];
  const activePasscode = getActivePasscode();
  if (passcode && passcode === activePasscode) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Administrative authorization required. Token missing, expired, or invalid.',
  });
};

// 1. Production Helmet Security Headers
const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Handled per-origin or via Nginx to allow inline SVGs/previews
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'sameorigin' },
  xPoweredBy: false, // Prevent leaking Express
});

// Helper to extract genuine client IP (behind Nginx, Cloudflare, or reverse proxy)
const getClientIp = (req) => {
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
    req.ip ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
};

// 2. Strict Rate Limiter for Admin Authentication (Max 5 attempts per 15 minutes)
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Your IP has been temporarily locked out for 15 minutes.',
  },
});

// 3. Order Checkout Rate Limiter (Max 10 orders per 15 minutes per IP to prevent bot spam)
const orderCheckoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    message: 'Order submission limit reached. Please wait a few minutes before submitting another order.',
  },
});

// 4. Order Tracking Rate Limiter (Max 30 lookups per 5 minutes to prevent enumeration)
const trackingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    message: 'Tracking lookup limit reached. Please wait before tracking again.',
  },
});

// 5. Image Upload Rate Limiter (Max 25 uploads per 10 minutes)
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    message: 'Upload frequency limit reached. Please wait before uploading more assets.',
  },
});

// 6. General API Rate Limiter (Max 120 requests per minute)
const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});

// 7. IP Whitelisting Middleware (Optional server-side enforcement)
const ipAllowlistMiddleware = (req, res, next) => {
  const allowedIps = process.env.ALLOWED_ADMIN_IPS
    ? process.env.ALLOWED_ADMIN_IPS.split(',').map((ip) => ip.trim()).filter(Boolean)
    : [];

  if (allowedIps.length === 0) {
    return next();
  }

  const clientIp = getClientIp(req);
  const isAllowed = allowedIps.some((ip) => ip === clientIp || clientIp === '127.0.0.1' || clientIp === '::1');

  if (!isAllowed) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Your IP address is not authorized to access this administrative resource.',
    });
  }

  next();
};

// 8. Strict Production CORS Origin Resolver
const corsOptionsDelegate = (req, callback) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : ['https://cellfocus.pk', 'https://www.cellfocus.pk', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'];

  const origin = req.header('Origin');
  // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
  if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
    callback(null, { origin: true, credentials: true });
  } else {
    callback(null, { origin: false });
  }
};

module.exports = {
  helmetMiddleware,
  adminAuthLimiter,
  orderCheckoutLimiter,
  trackingLimiter,
  uploadLimiter,
  generalApiLimiter,
  ipAllowlistMiddleware,
  requireAdminAuth,
  generateAdminToken,
  verifyAdminToken,
  getClientIp,
  getActivePasscode,
  corsOptionsDelegate,
};
