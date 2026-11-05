const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');

// Secret key for HMAC token signing (falls back to persistent or env)
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'cf-cellfocus-super-secure-key-992384';

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

// Middleware: Enforce admin session token
const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.headers['x-admin-token'] || req.query.admin_token);

  if (!rawToken || !verifyAdminToken(rawToken)) {
    return res.status(401).json({
      success: false,
      message: 'Administrative authorization required. Token missing, expired, or invalid.',
    });
  }

  next();
};

// 1. Helmet Security Headers
const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Vite SPA handles inline assets; can be hardened in production with exact hashes
  crossOriginEmbedderPolicy: false,
});

// Helper to extract genuine client IP (behind reverse proxies like Nginx or Cloudflare)
const getClientIp = (req) => {
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
    req.ip ||
    req.socket.remoteAddress
  );
};

// 2. Strict Rate Limiter for Admin Authentication (Max 5 attempts per 15 minutes)
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Your IP has been temporarily locked out for 15 minutes.',
  },
});

// 3. General API Rate Limiter (Max 120 requests per minute)
const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

// 4. IP Whitelisting Middleware (Optional server-side enforcement)
const ipAllowlistMiddleware = (req, res, next) => {
  const allowedIps = process.env.ALLOWED_ADMIN_IPS
    ? process.env.ALLOWED_ADMIN_IPS.split(',').map((ip) => ip.trim())
    : [];

  // If no IPs are explicitly configured in .env, allow local development
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

module.exports = {
  helmetMiddleware,
  adminAuthLimiter,
  generalApiLimiter,
  ipAllowlistMiddleware,
  requireAdminAuth,
  generateAdminToken,
  verifyAdminToken,
  getClientIp,
};
