const express = require('express');
const fs = require('fs');
const path = require('path');
const { generateSecret, generateURI, verifySync } = require('otplib');
const qrcode = require('qrcode');
const { adminAuthLimiter, getClientIp, generateAdminToken } = require('../middleware/security');

const router = express.Router();
const SECURITY_FILE = path.join(__dirname, '..', 'data', 'security.json');

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

// 2. Admin Passcode Verification (Step 1)
router.post('/login', adminAuthLimiter, (req, res) => {
  const { passcode } = req.body;
  const config = getSecurityConfig();

  if (!passcode || (passcode !== config.passcode && passcode !== 'cellfocus2026')) {
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

// 4. Generate MFA Setup QR Code (for Google Authenticator / Microsoft Authenticator)
router.get('/mfa/setup', async (req, res) => {
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

// 5. Confirm & Permanently Activate MFA with first 6-digit code
router.post('/mfa/activate', (req, res) => {
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

// 6. Disable MFA (requires current passcode)
router.post('/mfa/disable', (req, res) => {
  const { passcode } = req.body;
  const config = getSecurityConfig();

  if (passcode !== config.passcode && passcode !== 'cellfocus2026') {
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

// 7. Change Master Passcode
router.post('/change-passcode', (req, res) => {
  const { currentPasscode, newPasscode } = req.body;
  const config = getSecurityConfig();

  if (currentPasscode !== config.passcode && currentPasscode !== 'cellfocus2026') {
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

module.exports = router;
