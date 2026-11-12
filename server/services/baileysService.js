const path = require('path');
const fs = require('fs');
const os = require('os');
const zlib = require('zlib');
const QRCode = require('qrcode');
const pino = require('pino');

let makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, Browsers;
try {
  const baileys = require('@whiskeysockets/baileys');
  makeWASocket = baileys.default || baileys.makeWASocket;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  DisconnectReason = baileys.DisconnectReason;
  makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore;
  fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
  Browsers = baileys.Browsers;
} catch (e) {
  console.error('[Baileys] Error importing @whiskeysockets/baileys:', e.message);
}

const LEGACY_AUTH_DIR = path.join(__dirname, '..', 'data', 'baileys_auth');

function resolveAuthDir() {
  if (process.env.WHATSAPP_AUTH_DIR) {
    return path.resolve(process.env.WHATSAPP_AUTH_DIR);
  }
  // In Linux production (Hostinger), store session outside the git deploy folder so code pushes don't wipe it
  if (process.env.NODE_ENV === 'production' && process.platform !== 'win32') {
    const persistentDir = path.join(os.homedir(), '.cellfocus_baileys_auth');
    try {
      fs.mkdirSync(persistentDir, { recursive: true });
      return persistentDir;
    } catch {
      // Fallback to workspace data dir
    }
  }
  return LEGACY_AUTH_DIR;
}

const AUTH_DIR = resolveAuthDir();
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// Migrate legacy workspace session into persistent home dir once if needed
if (
  AUTH_DIR !== LEGACY_AUTH_DIR &&
  !fs.existsSync(path.join(AUTH_DIR, 'creds.json')) &&
  fs.existsSync(path.join(LEGACY_AUTH_DIR, 'creds.json'))
) {
  try {
    for (const f of fs.readdirSync(LEGACY_AUTH_DIR)) {
      const src = path.join(LEGACY_AUTH_DIR, f);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, path.join(AUTH_DIR, f));
      }
    }
    console.log(`[Baileys] Migrated existing session into persistent path: ${AUTH_DIR}`);
  } catch (err) {
    console.warn('[Baileys] Session migration warning:', err.message);
  }
}

const SAFE_AUTH_FILENAME_RE = /^[a-zA-Z0-9._@-]+$/;

function sanitizeSessionFileMap(filesObj) {
  if (!filesObj || typeof filesObj !== 'object' || Array.isArray(filesObj)) {
    throw new Error('Invalid session file bundle.');
  }
  const clean = {};
  for (const [name, content] of Object.entries(filesObj)) {
    if (
      typeof name !== 'string' ||
      !SAFE_AUTH_FILENAME_RE.test(name) ||
      name.includes('..') ||
      typeof content !== 'string'
    ) {
      throw new Error(`Invalid session entry: ${name}`);
    }
    clean[name] = content;
  }
  if (!clean['creds.json']) {
    throw new Error('Session bundle is missing creds.json.');
  }
  return clean;
}

class BaileysManager {
  constructor() {
    this.sock = null;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
    this.qrDataUrl = null;
    this.rawQR = null;
    this.connectedUser = null;
    this.reconnectAttempts = 0;
    this.replacedRetries = 0;
    this.reconnectTimer = null;
    this.watchdogTimer = null;
    this.isConnecting = false;
    this.lastError = null;
    this.logger = pino({ level: 'silent' });
  }

  _writeAuthFiles(fileMap) {
    const cleanFiles = sanitizeSessionFileMap(fileMap);
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    const entries = Object.entries(cleanFiles);
    for (const [name, content] of entries) {
      fs.writeFileSync(path.join(AUTH_DIR, name), content, 'utf8');
    }
    return entries.length;
  }

  restoreFromEnvIfNeeded() {
    try {
      const credsPath = path.join(AUTH_DIR, 'creds.json');
      const envB64 = (process.env.WHATSAPP_AUTH_GZ_B64 || '').trim();
      if (!fs.existsSync(credsPath) && envB64) {
        const jsonStr = zlib.gunzipSync(Buffer.from(envB64, 'base64')).toString('utf8');
        const fileMap = JSON.parse(jsonStr);
        const count = this._writeAuthFiles(fileMap);
        console.log(`[Baileys] Restored ${count} session files from WHATSAPP_AUTH_GZ_B64 env.`);
      }
    } catch (err) {
      console.error('[Baileys] Failed to restore session from WHATSAPP_AUTH_GZ_B64:', err.message);
    }
  }

  exportAuthState({ compact = false } = {}) {
    if (!fs.existsSync(AUTH_DIR)) {
      throw new Error('WhatsApp auth directory does not exist.');
    }
    const entries = fs.readdirSync(AUTH_DIR);
    const fileMap = {};

    const preKeyNums = entries
      .filter((f) => f.startsWith('pre-key-') && f.endsWith('.json'))
      .map((f) => ({ f, n: parseInt(f.slice(8, -5), 10) || 0 }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 20)
      .map((x) => x.f);
    const keepPreKeys = new Set(preKeyNums);

    for (const name of entries) {
      const fp = path.join(AUTH_DIR, name);
      if (!fs.statSync(fp).isFile() || !SAFE_AUTH_FILENAME_RE.test(name)) continue;
      if (compact) {
        const isEssential =
          name === 'creds.json' ||
          name.startsWith('app-state-sync-key-') ||
          name.startsWith('sender-key-memory-') ||
          name.startsWith('device-list-') ||
          keepPreKeys.has(name);
        if (!isEssential) continue;
      }
      fileMap[name] = fs.readFileSync(fp, 'utf8');
    }
    if (!fileMap['creds.json']) {
      throw new Error('No linked WhatsApp session (creds.json) found to export.');
    }
    const creds = JSON.parse(fileMap['creds.json']);
    const gzBuffer = zlib.gzipSync(Buffer.from(JSON.stringify(fileMap), 'utf8'));
    return {
      format: compact ? 'baileys-compact-gz-v1' : 'baileys-gz-v1',
      exportedAt: new Date().toISOString(),
      connectedUser: this.connectedUser || (creds?.me?.id ? String(creds.me.id).split(':')[0] : null),
      fileCount: Object.keys(fileMap).length,
      archiveGzBase64: gzBuffer.toString('base64'),
    };
  }

  async importAuthState(payload) {
    let fileMap = null;
    if (payload && typeof payload.archiveGzBase64 === 'string' && payload.archiveGzBase64.trim()) {
      const jsonStr = zlib.gunzipSync(Buffer.from(payload.archiveGzBase64.trim(), 'base64')).toString('utf8');
      fileMap = JSON.parse(jsonStr);
    } else if (payload && payload.files && typeof payload.files === 'object') {
      fileMap = payload.files;
    } else {
      throw new Error('Provide a valid baileys_auth_backup.json payload.');
    }

    this.cleanupSocket();
    this.isConnecting = false;
    this.status = 'disconnected';
    this.qrDataUrl = null;
    this.rawQR = null;
    this.connectedUser = null;
    this.reconnectAttempts = 0;
    this.replacedRetries = 0;

    const importedFiles = this._writeAuthFiles(fileMap);
    console.log(`[Baileys] Imported ${importedFiles} existing WhatsApp session files. Connecting...`);
    await this.init(true);
    await this.waitForConnection(8000);
    return {
      success: true,
      importedFiles,
      status: this.status,
      connectedUser: this.connectedUser,
      message:
        this.status === 'connected'
          ? `WhatsApp session restored & connected (+${this.connectedUser}) without QR scan!`
          : `Imported ${importedFiles} session files. Bot is connecting (${this.status})...`,
    };
  }

  cleanupSocket() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners('connection.update');
        this.sock.ev.removeAllListeners('creds.update');
        this.sock.ev.removeAllListeners('messages.upsert');
        this.sock.end(undefined);
      } catch (e) {
        // ignore errors during cleanup
      }
      this.sock = null;
    }
  }

  startWatchdog() {
    if (this.watchdogTimer) return;
    this.watchdogTimer = setInterval(() => {
      try {
        const hasCreds = fs.existsSync(path.join(AUTH_DIR, 'creds.json'));
        if (!hasCreds) return;
        const wsClosed = this.sock?.ws && this.sock.ws.isOpen === false;
        if ((this.status === 'connected' && wsClosed) || (this.status === 'disconnected' && !this.isConnecting && !this.reconnectTimer && this.replacedRetries < 3)) {
          console.log('[Baileys Watchdog] Detected dropped socket while session exists — triggering clean auto-reconnect...');
          this.init(true);
        }
      } catch {
        // ignore watchdog errors
      }
    }, 45000);
    if (typeof this.watchdogTimer.unref === 'function') {
      this.watchdogTimer.unref();
    }
  }

  async init(force = false) {
    if (!makeWASocket || !useMultiFileAuthState) {
      console.error('[Baileys] Module not properly loaded.');
      return;
    }

    if (this.isConnecting && !force) {
      console.log('[Baileys] Connection initialization already in progress, skipping duplicate call.');
      return;
    }

    this.isConnecting = true;
    this.cleanupSocket();

    try {
      this.restoreFromEnvIfNeeded();
      this.status = 'connecting';
      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

      let waVersion;
      try {
        if (typeof fetchLatestBaileysVersion === 'function') {
          const vRes = await fetchLatestBaileysVersion();
          if (Array.isArray(vRes?.version)) waVersion = vRes.version;
        }
      } catch {
        // fallback to packaged version
      }

      const authKeys = typeof makeCacheableSignalKeyStore === 'function'
        ? makeCacheableSignalKeyStore(state.keys, this.logger)
        : state.keys;

      this.sock = makeWASocket({
        ...(waVersion ? { version: waVersion } : {}),
        auth: {
          creds: state.creds,
          keys: authKeys,
        },
        logger: this.logger,
        printQRInTerminal: true,
        browser: typeof Browsers?.ubuntu === 'function' ? Browsers.ubuntu('Chrome') : ['CellFocus Store', 'Chrome', '128.0.0'],
        syncFullHistory: false,
        markOnlineOnConnect: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
      });

      this.startWatchdog();
      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.rawQR = qr;
          try {
            this.qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
            this.status = 'qr_ready';
            this.isConnecting = false;
            console.log('\n======================================================');
            console.log('⚡ [CellFocus WhatsApp Bot] SCAN QR CODE TO CONNECT:');
            console.log('Open WhatsApp on your phone -> Linked Devices -> Link a Device');
            console.log('You can also scan this QR inside your CellFocus Admin Panel!');
            console.log('======================================================\n');
          } catch (qrErr) {
            console.error('[Baileys] Error generating QR Data URL:', qrErr.message);
          }
        }

        if (connection === 'close') {
          this.isConnecting = false;
          this.status = 'disconnected';
          this.qrDataUrl = null;
          this.connectedUser = null;

          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason?.loggedOut;
          const isReplaced = statusCode === DisconnectReason?.connectionReplaced || statusCode === 440;
          this.lastError = lastDisconnect?.error?.message
            ? `${lastDisconnect.error.message}${statusCode ? ` (code ${statusCode})` : ''}`
            : (statusCode ? `Disconnect code ${statusCode}` : 'Connection closed');

          console.log(`[Baileys] Connection closed. Reason code: ${statusCode}. Logged out? ${isLoggedOut}. Replaced? ${isReplaced}`);

          if (isLoggedOut) {
            console.log('[Baileys] Device logged out (401). Clearing auth directory to generate fresh QR...');
            try {
              fs.rmSync(AUTH_DIR, { recursive: true, force: true });
              fs.mkdirSync(AUTH_DIR, { recursive: true });
            } catch (rmErr) {
              console.error('[Baileys] Error clearing auth dir:', rmErr.message);
            }
            this.reconnectTimer = setTimeout(() => this.init(true), 2000);
          } else if (isReplaced) {
            if (this.replacedRetries < 3) {
              const waitMs = 12000 * (this.replacedRetries + 1);
              this.replacedRetries++;
              console.warn(`[Baileys] Connection replaced (440) — waiting ${waitMs / 1000}s before recovery retry ${this.replacedRetries}/3 (handles server restarts cleanly)...`);
              this.reconnectTimer = setTimeout(() => this.init(true), waitMs);
            } else {
              console.warn('[Baileys] Repeated 440 collision detected. Halting auto-reconnect until manual Restart in Admin Panel.');
            }
          } else {
            // Transient network disconnect or code 515 restartRequired
            const delay = Math.min(15000, (this.reconnectAttempts + 1) * 2500);
            this.reconnectAttempts++;
            console.log(`[Baileys] Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})...`);
            this.reconnectTimer = setTimeout(() => this.init(true), delay);
          }
        } else if (connection === 'open') {
          this.isConnecting = false;
          this.status = 'connected';
          this.qrDataUrl = null;
          this.rawQR = null;
          this.lastError = null;
          this.reconnectAttempts = 0;
          this.replacedRetries = 0;

          const userJid = this.sock.user?.id || '';
          const phone = userJid.split(':')[0] || userJid.split('@')[0];
          this.connectedUser = phone;

          console.log('\n======================================================');
          console.log(`🎉 [CellFocus WhatsApp Bot] CONNECTED SUCCESSFULLY!`);
          console.log(`Active Phone: +${phone}`);
          console.log(`All customer orders will now receive AUTOMATIC WhatsApp messages!`);
          console.log('======================================================\n');
        }
      });
    } catch (err) {
      console.error('[Baileys] Init error:', err.message);
      this.isConnecting = false;
      this.status = 'disconnected';
      this.lastError = err.message;
    }
  }

  async waitForConnection(timeoutMs = 5000) {
    const start = Date.now();
    while (this.status !== 'connected' && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return this.status === 'connected';
  }

  getStatus() {
    return {
      status: this.status,
      connectedUser: this.connectedUser,
      hasSession: fs.existsSync(path.join(AUTH_DIR, 'creds.json')),
      lastError: this.lastError,
      hasQR: !!this.qrDataUrl,
      qr: this.qrDataUrl,
    };
  }

  async logout() {
    this.cleanupSocket();
    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    } catch (e) {
      // ignore
    }
    this.status = 'disconnected';
    this.connectedUser = null;
    this.qrDataUrl = null;
    this.reconnectAttempts = 0;
    setTimeout(() => this.init(true), 1500);
    return { success: true, message: 'Logged out successfully' };
  }

  async sendTextMessage(cleanPhone, messageText) {
    if (this.status === 'connecting') {
      console.log('[Baileys] Bot is connecting... waiting up to 5s before dispatching message.');
      await this.waitForConnection(5000);
    }

    if (!this.sock || this.status !== 'connected') {
      console.warn(`[Baileys] Cannot send: WhatsApp bot not connected (current status: ${this.status})`);
      return { success: false, reason: `WhatsApp bot is ${this.status}. Please check WhatsApp tab in Admin Panel.` };
    }

    try {
      let targetJid = `${cleanPhone}@s.whatsapp.net`;

      // Verify and resolve official JID with onWhatsApp if available
      try {
        if (typeof this.sock.onWhatsApp === 'function') {
          const results = await this.sock.onWhatsApp(cleanPhone);
          if (Array.isArray(results) && results.length > 0 && results[0]?.exists) {
            targetJid = results[0].jid;
            console.log(`[Baileys] Verified WhatsApp target for ${cleanPhone}: ${targetJid}`);
          }
        }
      } catch (chkErr) {
        console.warn(`[Baileys] onWhatsApp lookup notice: ${chkErr.message}`);
      }

      const result = await this.sock.sendMessage(targetJid, { text: messageText });
      console.log(`[Baileys] Message sent successfully to ${targetJid} (Message ID: ${result?.key?.id})`);
      return { success: true, messageId: result?.key?.id, to: targetJid };
    } catch (err) {
      console.error(`[Baileys] Failed to send message to ${cleanPhone}:`, err.message);
      return { success: false, error: err.message };
    }
  }
}

const baileysManager = new BaileysManager();
module.exports = baileysManager;
