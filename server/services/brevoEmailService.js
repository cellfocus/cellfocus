const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'email_config.json');

class BrevoEmailService {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    let fileConfig = {};
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      }
    } catch (e) {
      console.warn('[Brevo Email] Could not read email_config.json:', e.message);
    }

    return {
      apiKey: fileConfig.apiKey || process.env.BREVO_API_KEY || '',
      senderEmail: fileConfig.senderEmail || process.env.BREVO_SENDER_EMAIL || '',
      senderName: fileConfig.senderName || process.env.BREVO_SENDER_NAME || 'CellFocus Store Alerts',
      adminEmail: fileConfig.adminEmail || process.env.ADMIN_ALERT_EMAIL || process.env.BREVO_ADMIN_EMAIL || '',
      enabled: fileConfig.enabled !== undefined ? fileConfig.enabled : true,
    };
  }

  saveConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig,
    };

    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2), 'utf8');
      console.log('[Brevo Email] Configuration updated successfully.');
      return { success: true, config: this.getPublicConfig() };
    } catch (e) {
      console.error('[Brevo Email] Failed to save email_config.json:', e.message);
      return { success: false, error: e.message };
    }
  }

  getPublicConfig() {
    const rawKey = this.config.apiKey || '';
    const maskedKey = rawKey.length > 10 
      ? `${rawKey.substring(0, 8)}...${rawKey.substring(rawKey.length - 4)}` 
      : (rawKey ? '********' : '');

    return {
      apiKeyConfigured: !!rawKey,
      maskedApiKey: maskedKey,
      senderEmail: this.config.senderEmail,
      senderName: this.config.senderName,
      adminEmail: this.config.adminEmail,
      enabled: this.config.enabled,
    };
  }

  /**
   * Generates a modern, high-converting responsive HTML email template for new orders
   */
  generateOrderEmailHtml(order) {
    const customer = order.customer || {};
    const items = order.items || [];
    const orderId = order.orderId || 'N/A';
    const total = Number(order.total || 0).toLocaleString();
    const subtotal = Number(order.subtotal || 0).toLocaleString();
    const shipping = order.shipping === 0 ? 'FREE' : `Rs. ${Number(order.shipping || 0).toLocaleString()} PKR`;
    const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Karachi' }) : new Date().toLocaleString();

    const itemsRows = items.map((item) => {
      const itemTotal = (Number(item.price || 0) * Number(item.qty || 1)).toLocaleString();
      const imgTag = item.image 
        ? `<img src="${item.image}" alt="${item.name}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; background: #f4f2ea; border: 1px solid #e5e2d6;" />` 
        : `<div style="width: 48px; height: 48px; border-radius: 8px; background: #eeebe2; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #78746a;">Item</div>`;

      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0eee6; vertical-align: middle; width: 56px;">
            ${imgTag}
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #f0eee6; vertical-align: middle;">
            <div style="font-size: 14px; font-weight: 600; color: #1c1b18; line-height: 1.3;">${item.name}</div>
            <div style="font-size: 12px; color: #78746a; margin-top: 2px;">Qty: <strong style="color: #1c1b18;">${item.qty}</strong> × Rs. ${Number(item.price || 0).toLocaleString()}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0eee6; vertical-align: middle; text-align: right; font-family: monospace; font-size: 14px; font-weight: 700; color: #1c1b18;">
            Rs. ${itemTotal}
          </td>
        </tr>
      `;
    }).join('');

    const cleanPhone = (customer.phone || '').replace(/\D/g, '');
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '92' + cleanPhone.substring(1) : cleanPhone}` : '#';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Order Alert #${orderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f6f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1b18;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7f6f2; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background: #ffffff; border-radius: 16px; border: 1px solid #e5e2d6; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);" cellspacing="0" cellpadding="0">
          
          <!-- Top Header -->
          <tr>
            <td style="background: #1c1b18; padding: 24px 28px; text-align: left;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">CELL<span style="color: #10b981;">FOCUS</span></div>
                    <div style="font-size: 11px; color: #a8a29e; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">Store Order Notification</div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background: #064e3b; color: #6ee7b7; border: 1px solid #059669; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-transform: uppercase;">
                      New Order
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="background: #ecfdf5; border-bottom: 1px solid #a7f3d0; padding: 16px 28px;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 15px; font-weight: 700; color: #065f46;">
                    🚨 You just received a new order!
                  </td>
                  <td align="right" style="font-family: monospace; font-size: 14px; font-weight: 800; color: #064e3b;">
                    #${orderId}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 28px;">
              
              <!-- Customer Details Card -->
              <div style="background: #faf8f4; border: 1px solid #eeebe2; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #78746a; margin-bottom: 12px;">
                  Customer Information
                </div>

                <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                  <tr>
                    <td style="padding: 4px 0; color: #78746a; width: 90px;">Name:</td>
                    <td style="padding: 4px 0; font-weight: 700; color: #1c1b18;">${customer.name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #78746a;">Phone:</td>
                    <td style="padding: 4px 0; font-weight: 700; color: #1c1b18;">
                      <a href="tel:${customer.phone}" style="color: #1c1b18; text-decoration: underline;">${customer.phone || 'N/A'}</a>
                      ${cleanPhone ? `&nbsp;•&nbsp;<a href="${waLink}" style="color: #059669; font-weight: 700; text-decoration: none;">💬 WhatsApp</a>` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #78746a;">Address:</td>
                    <td style="padding: 4px 0; color: #1c1b18;">${customer.address || 'N/A'}</td>
                  </tr>
                  ${customer.city ? `
                  <tr>
                    <td style="padding: 4px 0; color: #78746a;">City:</td>
                    <td style="padding: 4px 0; font-weight: 600; color: #1c1b18;">${customer.city}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding: 4px 0; color: #78746a;">Placed At:</td>
                    <td style="padding: 4px 0; color: #78746a; font-size: 12px;">${createdAt}</td>
                  </tr>
                </table>
              </div>

              <!-- Ordered Items -->
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #78746a; margin-bottom: 8px;">
                Items in this Order (${items.length})
              </div>

              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                ${itemsRows}
              </table>

              <!-- Financial Totals -->
              <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; border-top: 1px solid #e5e2d6; padding-top: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 4px 0; color: #78746a;">Subtotal:</td>
                  <td align="right" style="padding: 4px 0; font-family: monospace; color: #1c1b18;">Rs. ${subtotal}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #78746a;">Shipping:</td>
                  <td align="right" style="padding: 4px 0; font-family: monospace; color: #1c1b18;">${shipping}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0 0 0; font-size: 15px; font-weight: 800; color: #1c1b18;">Total Amount Due:</td>
                  <td align="right" style="padding: 8px 0 0 0; font-family: monospace; font-size: 18px; font-weight: 800; color: #059669;">
                    Rs. ${total} PKR
                  </td>
                </tr>
                <tr>
                  <td style="padding: 2px 0; color: #78746a; font-size: 11px;">Payment:</td>
                  <td align="right" style="padding: 2px 0; font-size: 11px; font-weight: 600; color: #78746a;">Cash on Delivery (COD)</td>
                </tr>
              </table>

              <!-- Action Callouts -->
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    ${cleanPhone ? `
                    <a href="${waLink}" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 10px; margin-right: 8px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">
                      💬 Message Customer on WhatsApp
                    </a>
                    ` : ''}
                    <a href="tel:${customer.phone}" style="display: inline-block; background: #1c1b18; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 20px; border-radius: 10px;">
                      📞 Call Customer
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #faf8f4; border-top: 1px solid #eeebe2; padding: 16px 28px; text-align: center; font-size: 11px; color: #78746a;">
              CellFocus Automated Order Alert System • Powered by Brevo
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Send order notification email via Brevo REST API v3
   */
  async sendNewOrderAlert(order) {
    // Refresh configuration in case it changed
    this.config = this.loadConfig();

    if (!this.config.enabled) {
      console.log('[Brevo Email] Email alert system is disabled in settings.');
      return { success: false, reason: 'Email alert system disabled' };
    }

    const apiKey = this.config.apiKey;
    const adminEmail = this.config.adminEmail;

    if (!apiKey) {
      console.warn('[Brevo Email] Cannot send alert: BREVO_API_KEY is not configured.');
      return { success: false, reason: 'BREVO_API_KEY is missing. Please configure it in .env or Admin Panel.' };
    }

    if (!adminEmail) {
      console.warn('[Brevo Email] Cannot send alert: ADMIN_ALERT_EMAIL is not configured.');
      return { success: false, reason: 'ADMIN_ALERT_EMAIL is missing. Please set recipient email in Admin Panel.' };
    }

    const senderEmail = this.config.senderEmail || adminEmail;
    const senderName = this.config.senderName || 'CellFocus Store Alerts';
    const orderId = order.orderId || 'Order';
    const totalAmount = Number(order.total || 0).toLocaleString();
    const customerName = order.customer?.name || 'Customer';

    const subject = `🚨 New Order #${orderId} from ${customerName} (Rs. ${totalAmount} PKR)`;
    const htmlContent = this.generateOrderEmailHtml(order);

    const payload = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: adminEmail,
          name: 'CellFocus Admin',
        },
      ],
      subject,
      htmlContent,
    };

    try {
      console.log(`[Brevo Email] Sending new order alert for #${orderId} to ${adminEmail}...`);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('[Brevo Email] Brevo API error response:', data);
        return {
          success: false,
          error: data.message || `Brevo API returned status ${response.status}`,
          data,
        };
      }

      console.log(`[Brevo Email] Alert email sent successfully! MessageId: ${data.messageId}`);
      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (err) {
      console.error('[Brevo Email] Network / Fetch error:', err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Sends a test email to verify Brevo API Key and sender email
   */
  async sendTestEmail(targetEmail) {
    this.config = this.loadConfig();

    const apiKey = this.config.apiKey;
    const recipient = targetEmail || this.config.adminEmail;

    if (!apiKey) {
      return { success: false, error: 'BREVO_API_KEY is not configured. Please enter your Brevo API key first.' };
    }
    if (!recipient) {
      return { success: false, error: 'Recipient email address is required.' };
    }

    const senderEmail = this.config.senderEmail || recipient;
    const senderName = this.config.senderName || 'CellFocus Store Alerts';

    const payload = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: recipient,
          name: 'CellFocus Administrator',
        },
      ],
      subject: '✅ CellFocus Brevo Email Alert System Test',
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e2d6; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #10b981; margin-top: 0;">🎉 Brevo Email Integration Active!</h2>
          <p style="color: #1c1b18; font-size: 14px; line-height: 1.5;">
            This test email confirms that your <strong>Brevo (Sendinblue)</strong> integration is operating perfectly.
          </p>
          <div style="background: #faf8f4; border: 1px solid #eeebe2; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #4a473f; margin: 16px 0;">
            <strong>Sender:</strong> ${senderName} &lt;${senderEmail}&gt;<br/>
            <strong>Recipient:</strong> ${recipient}<br/>
            <strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })} (PKT)
          </div>
          <p style="color: #78746a; font-size: 12px;">
            Whenever a customer places an order on CellFocus, an instant detailed notification with order items, totals, and one-click WhatsApp/Call buttons will be delivered to this inbox.
          </p>
        </div>
      `,
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `Brevo API returned status ${response.status}`,
          data,
        };
      }

      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Sends an Admin Passcode Reset OTP email to the registered admin email (cellfocusc21@gmail.com)
   */
  async sendPasscodeResetEmail(targetEmail, otpCode) {
    this.config = this.loadConfig();
    const apiKey = this.config.apiKey;
    const recipient = targetEmail || this.config.adminEmail || 'cellfocusc21@gmail.com';

    if (!apiKey) {
      console.warn('[Brevo Email] BREVO_API_KEY is missing. Passcode OTP logged to console:', otpCode);
      return { success: false, error: 'BREVO_API_KEY is missing in settings.', devOtp: otpCode };
    }

    const senderEmail = this.config.senderEmail || 'cellfocusc21@gmail.com';
    const senderName = this.config.senderName || 'CellFocus Security';

    const payload = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: recipient,
          name: 'CellFocus Store Admin',
        },
      ],
      subject: `🔐 CellFocus Admin Passcode Reset Code: ${otpCode}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f7f4ec; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 15px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width: 520px; background: #ffffff; border-radius: 16px; border: 1px solid #e5e0d4; box-shadow: 0 4px 20px rgba(0,0,0,0.04); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: #1c1b18; padding: 24px 30px; text-align: center;">
                      <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #ffffff;">CELL<span style="color: #00FFFF;">FOCUS</span></h1>
                      <div style="font-size: 11px; color: #9ca3af; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;">Admin Security Portal</div>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px 30px;">
                      <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #1c1b18;">Admin Passcode Reset Request</h2>
                      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #4a473f;">
                        A request was received to reset the Master Admin Passcode for your CellFocus Store. Use the 6-digit verification code below to authorize this change:
                      </p>

                      <!-- OTP Box -->
                      <div style="background: #fbf9f4; border: 2px dashed #00FFFF; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                        <span style="font-family: monospace, Consolas, Courier; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1c1b18;">${otpCode}</span>
                        <div style="font-size: 11px; color: #78746a; margin-top: 8px; font-weight: 500;">Valid for 15 minutes • Do not share with anyone</div>
                      </div>

                      <div style="background: #f6f5f0; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #78746a; line-height: 1.5; margin-bottom: 24px;">
                        <strong>Security Notice:</strong> If you did not request this password reset, please ignore this email. Your current passcode remains completely secure.
                      </div>

                      <p style="margin: 0; font-size: 12px; color: #a8a29e; text-align: center;">
                        Targeted Account: <strong>${recipient}</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background: #faf8f4; border-top: 1px solid #eeebe2; padding: 16px 30px; text-align: center; font-size: 11px; color: #9ca3af;">
                      © ${new Date().getFullYear()} CellFocus Mobile Accessories • Security Verification System
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      console.log(`[Brevo Email] Sending Passcode Reset Code to ${recipient}...`);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error('[Brevo Email] Error sending reset email:', data);
        return {
          success: false,
          error: data.message || `Brevo API error: ${response.status}`,
          devOtp: otpCode,
        };
      }

      console.log(`[Brevo Email] Passcode reset email dispatched successfully! MessageId: ${data.messageId}`);
      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (err) {
      console.error('[Brevo Email] Network error sending reset email:', err.message);
      return {
        success: false,
        error: err.message,
        devOtp: otpCode,
      };
    }
  }
}

const brevoEmailService = new BrevoEmailService();
module.exports = brevoEmailService;

