const express = require('express');
const fs = require('fs');
const path = require('path');
const { generateSecret, generateURI, verifySync } = require('otplib');
const qrcode = require('qrcode');
const { adminAuthLimiter, getClientIp, generateAdminToken, requireAdminAuth, verifyAdminToken, safeStringEqual } = require('../middleware/security');
const repo = require('../storage');

const router = express.Router();
const SECURITY_FILE = path.join(__dirname, '..', 'data', 'security.json');
const RATES_FILE = path.join(__dirname, '..', 'data', 'rates.json');

function getRatesConfig() {
  try {
    if (fs.existsSync(RATES_FILE)) {
      return JSON.parse(fs.readFileSync(RATES_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Error reading rates.json:', e);
  }
  return {
    base: 'PKR',
    rates: { PKR: 1, USD: 278.5, AED: 75.8, SAR: 74.2 },
    updatedAt: new Date().toISOString(),
  };
}

function saveRatesConfig(data) {
  try {
    fs.writeFileSync(RATES_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving rates.json:', e);
  }
}

// Helper to read / write security config
function getSecurityConfig() {
  try {
    if (fs.existsSync(SECURITY_FILE)) {
      return JSON.parse(fs.readFileSync(SECURITY_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Error reading security.json:', e);
  }
  return {
    passcode: 'cellfocus2026',
    mfaEnabled: false,
    mfaSecret: null,
    tempMfaSecret: null,
  };
}

function saveSecurityConfig(data) {
  try {
    fs.writeFileSync(SECURITY_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving security.json:', e);
  }
}

// 1. Get current security status
router.get('/status', (req, res) => {
  const config = getSecurityConfig();
  res.json({
    success: true,
    mfaEnabled: Boolean(config.mfaEnabled),
    ipWhitelisting: Boolean(process.env.ALLOWED_ADMIN_IPS),
    clientIp: getClientIp(req),
  });
});

// 1b. Verify active admin session token
router.get('/verify', requireAdminAuth, (req, res) => {
  res.json({ success: true, authenticated: true });
});

// 2. Admin Passcode Verification (Step 1)
router.post('/login', adminAuthLimiter, (req, res) => {
  const { passcode } = req.body;
  const config = getSecurityConfig();
  const validPasscode = config.passcode || process.env.ADMIN_PASSCODE || 'cellfocus2026';

  if (!passcode || !safeStringEqual(String(passcode), String(validPasscode))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid Master Admin Passcode.',
    });
  }

  // If MFA is enabled, require Step 2 TOTP token
  if (config.mfaEnabled && config.mfaSecret) {
    return res.json({
      success: true,
      requireMfa: true,
      message: 'Passcode verified. Please enter your 6-digit Authenticator code.',
    });
  }

  // Otherwise, issue authenticated session token
  const sessionToken = generateAdminToken();
  res.json({
    success: true,
    requireMfa: false,
    token: sessionToken,
    message: 'Authentication successful. Access granted.',
  });
});

// 3. Step 2: Verify MFA TOTP code during login
router.post('/mfa/verify', adminAuthLimiter, (req, res) => {
  const { token } = req.body;
  const config = getSecurityConfig();

  if (!config.mfaEnabled || !config.mfaSecret) {
    return res.status(400).json({
      success: false,
      message: 'Multi-Factor Authentication is not enabled on this server.',
    });
  }

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a 6-digit authentication code.',
    });
  }

  let isValid = false;
  try {
    isValid = verifySync({ token: token.trim(), secret: config.mfaSecret });
  } catch (err) {
    console.warn('MFA verify error:', err);
  }

  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired 6-digit code. Please check your Authenticator app.',
    });
  }

  const sessionToken = generateAdminToken();
  res.json({
    success: true,
    token: sessionToken,
    message: 'MFA Verified successfully. Access granted.',
  });
});

// 4. Generate MFA Setup QR Code (Admin Protected)
router.get('/mfa/setup', requireAdminAuth, async (req, res) => {
  const config = getSecurityConfig();
  const secret = generateSecret();

  // Save temporarily until verified
  config.tempMfaSecret = secret;
  saveSecurityConfig(config);

  const otpauth = generateURI({
    secret,
    label: 'admin@cellfocus.pk',
    issuer: 'CellFocus Store Admin',
  });

  try {
    const qrImageUrl = await qrcode.toDataURL(otpauth);
    res.json({
      success: true,
      secret,
      qrImageUrl,
      otpauth,
      instructions: 'Scan this QR code with Google Authenticator, Microsoft Authenticator, or 1Password, then enter the 6-digit code to activate.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code.',
    });
  }
});

// 5. Confirm & Permanently Activate MFA with first 6-digit code (Admin Protected)
router.post('/mfa/activate', requireAdminAuth, (req, res) => {
  const { token } = req.body;
  const config = getSecurityConfig();

  if (!config.tempMfaSecret) {
    return res.status(400).json({
      success: false,
      message: 'No pending MFA setup found. Please generate a QR code first.',
    });
  }

  let isValid = false;
  try {
    isValid = verifySync({ token: token.trim(), secret: config.tempMfaSecret });
  } catch (err) {
    console.warn('MFA activate error:', err);
  }

  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid confirmation code. Please ensure your device clock is accurate.',
    });
  }

  config.mfaEnabled = true;
  config.mfaSecret = config.tempMfaSecret;
  config.tempMfaSecret = null;
  config.mfaActivatedAt = new Date().toISOString();
  saveSecurityConfig(config);

  res.json({
    success: true,
    message: 'Multi-Factor Authentication (MFA) is now permanently active!',
  });
});

// 6. Disable MFA (requires current passcode, Admin Protected)
router.post('/mfa/disable', requireAdminAuth, (req, res) => {
  const { passcode } = req.body;
  const config = getSecurityConfig();
  const validPasscode = config.passcode || process.env.ADMIN_PASSCODE || 'cellfocus2026';

  if (!safeStringEqual(String(passcode || ''), String(validPasscode))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid Master Passcode. Authorization denied.',
    });
  }

  config.mfaEnabled = false;
  config.mfaSecret = null;
  config.tempMfaSecret = null;
  saveSecurityConfig(config);

  res.json({
    success: true,
    message: 'Multi-Factor Authentication has been disabled.',
  });
});

// 7. Change Master Passcode (Admin Protected)
router.post('/change-passcode', requireAdminAuth, (req, res) => {
  const { currentPasscode, newPasscode } = req.body;
  const config = getSecurityConfig();
  const validPasscode = config.passcode || process.env.ADMIN_PASSCODE || 'cellfocus2026';

  if (!safeStringEqual(String(currentPasscode || ''), String(validPasscode))) {
    return res.status(401).json({
      success: false,
      message: 'Current Master Passcode is incorrect.',
    });
  }

  if (!newPasscode || newPasscode.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New passcode must be at least 6 characters long.',
    });
  }

  config.passcode = newPasscode;
  saveSecurityConfig(config);

  res.json({
    success: true,
    message: 'Master Admin Passcode updated successfully.',
  });
});

// 7b. Request Password Reset OTP via Email (linked to cellfocusc21@gmail.com)
router.post('/forgot-passcode', adminAuthLimiter, async (req, res) => {
  try {
    const config = getSecurityConfig();
    const adminEmail = 'cellfocusc21@gmail.com';

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    config.resetOtp = otpCode;
    config.resetOtpExpiresAt = expiresAt;
    saveSecurityConfig(config);

    // Send code via Brevo Email to cellfocusc21@gmail.com
    const emailResult = await brevoEmailService.sendPasscodeResetEmail(adminEmail, otpCode);

    console.log(`[Admin Security] Passcode reset requested. OTP for ${adminEmail}: ${otpCode}`);

    return res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${adminEmail}.`,
      targetEmail: adminEmail,
      devOtp: process.env.NODE_ENV !== 'production' ? emailResult.devOtp : undefined,
    });
  } catch (err) {
    console.error('[Admin Security] Forgot passcode error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate password reset. Please try again.',
    });
  }
});

// 7c. Verify OTP & Set New Master Passcode
router.post('/reset-passcode', adminAuthLimiter, (req, res) => {
  try {
    const { otp, newPasscode } = req.body;
    const config = getSecurityConfig();

    if (!config.resetOtp || !config.resetOtpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'No pending password reset request found. Please request a new code.',
      });
    }

    if (Date.now() > config.resetOtpExpiresAt) {
      config.resetOtp = null;
      config.resetOtpExpiresAt = null;
      saveSecurityConfig(config);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired (15 minute limit). Please request a fresh code.',
      });
    }

    if (!otp || String(otp).trim() !== String(config.resetOtp).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 6-digit verification code. Please check your email.',
      });
    }

    if (!newPasscode || newPasscode.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New passcode must be at least 6 characters long.',
      });
    }

    // Passcode validated — apply update
    config.passcode = newPasscode.trim();
    config.resetOtp = null;
    config.resetOtpExpiresAt = null;
    config.passcodeResetAt = new Date().toISOString();
    saveSecurityConfig(config);

    // Issue authentic admin session token
    const token = generateAdminToken();

    console.log('[Admin Security] Passcode successfully reset via email verification.');

    return res.json({
      success: true,
      token,
      message: 'Master Admin Passcode updated successfully! Welcome back.',
    });
  } catch (err) {
    console.error('[Admin Security] Reset passcode error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset passcode. Please try again.',
    });
  }
});

// 8. Get Currency Exchange Rates
router.get('/rates', (req, res) => {
  const config = getRatesConfig();
  res.json({
    success: true,
    base: config.base || 'PKR',
    rates: config.rates || { PKR: 1, USD: 278.5, AED: 75.8, SAR: 74.2 },
    updatedAt: config.updatedAt,
  });
});

// 9. Update Currency Exchange Rates (Admin Protected)
router.post('/rates', requireAdminAuth, (req, res) => {
  const { rates } = req.body;

  if (!rates || typeof rates !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Valid rates object is required.',
    });
  }

  const usd = parseFloat(rates.USD);
  const aed = parseFloat(rates.AED);
  const sar = parseFloat(rates.SAR);

  if (isNaN(usd) || usd <= 0 || isNaN(aed) || aed <= 0 || isNaN(sar) || sar <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Rates for USD, AED, and SAR must be valid positive numbers.',
    });
  }

  const updatedConfig = {
    base: 'PKR',
    rates: {
      PKR: 1,
      USD: parseFloat(usd.toFixed(4)),
      AED: parseFloat(aed.toFixed(4)),
      SAR: parseFloat(sar.toFixed(4)),
    },
    updatedAt: new Date().toISOString(),
  };

  saveRatesConfig(updatedConfig);

  res.json({
    success: true,
    message: 'Currency exchange rates saved successfully.',
    data: updatedConfig,
  });
});

// ==========================================
// WhatsApp Bot (Baileys) Management Endpoints
// ==========================================
const baileysManager = require('../services/baileysService');
const whatsappService = require('../services/whatsappService');
const brevoEmailService = require('../services/brevoEmailService');

// GET WhatsApp Bot Connection Status & Live QR (Admin Protected)
router.get('/whatsapp/status', requireAdminAuth, (req, res) => {
  try {
    res.json({
      success: true,
      data: baileysManager.getStatus(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Restart / Request fresh QR code (Admin Protected)
router.post('/whatsapp/restart', requireAdminAuth, (req, res) => {
  try {
    baileysManager.init(true);
    res.json({ success: true, message: 'WhatsApp bot connection restarted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Logout / Unlink current WhatsApp device (Admin Protected)
router.post('/whatsapp/logout', requireAdminAuth, async (req, res) => {
  try {
    const result = await baileysManager.logout();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Send Test Message (Admin Protected)
router.post('/whatsapp/test', requireAdminAuth, async (req, res) => {
  try {
    const { phone, message } = req.body;
    const cleanPhone = whatsappService.cleanWhatsAppPhone(phone || baileysManager.connectedUser);
    if (!cleanPhone) {
      return res.status(400).json({ success: false, message: 'Valid phone number required.' });
    }
    const testMsg = message || `⚡ CellFocus WhatsApp Bot test message! Connected and functioning properly.`;
    const result = await baileysManager.sendTextMessage(cleanPhone, testMsg);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Resend Order Confirmation via WhatsApp (Admin Protected)
router.post('/whatsapp/resend/:orderId', requireAdminAuth, async (req, res) => {
  try {
    const order = await repo.getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const result = await whatsappService.sendAutomatedWhatsApp(order, req.body.type || 'Placed');
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET Export Linked WhatsApp Session Backup (Admin Protected)
router.get('/whatsapp/export-auth', requireAdminAuth, (req, res) => {
  try {
    const bundle = baileysManager.exportAuthState();
    res.json({ success: true, data: bundle });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST Import Linked WhatsApp Session Backup without Rescanning QR (Admin Protected)
router.post('/whatsapp/import-auth', requireAdminAuth, async (req, res) => {
  try {
    const result = await baileysManager.importAuthState(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// Brevo Email Alert Endpoints
// ==========================================

// GET Brevo Email Alert Config (Admin Protected)
router.get('/email/config', requireAdminAuth, (req, res) => {
  try {
    res.json({
      success: true,
      data: brevoEmailService.getPublicConfig(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Update Brevo Email Alert Config (Admin Protected)
router.post('/email/config', requireAdminAuth, (req, res) => {
  try {
    const { apiKey, senderEmail, senderName, adminEmail, enabled } = req.body;
    const update = {};
    if (apiKey !== undefined && apiKey !== '********' && !apiKey.includes('...')) {
      update.apiKey = apiKey.trim();
    }
    if (senderEmail !== undefined) update.senderEmail = senderEmail.trim();
    if (senderName !== undefined) update.senderName = senderName.trim();
    if (adminEmail !== undefined) update.adminEmail = adminEmail.trim();
    if (enabled !== undefined) update.enabled = !!enabled;

    const result = brevoEmailService.saveConfig(update);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Send Brevo Test Email (Admin Protected)
router.post('/email/test', requireAdminAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const result = await brevoEmailService.sendTestEmail(email);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Resend Order Alert Email to Admin (Admin Protected)
router.post('/email/resend/:orderId', requireAdminAuth, async (req, res) => {
  try {
    const order = await repo.getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const result = await brevoEmailService.sendNewOrderAlert(order);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
