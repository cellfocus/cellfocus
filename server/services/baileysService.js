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

const LOCK_FILE = path.join(AUTH_DIR, 'bot.lock');
const STATUS_FILE = path.join(AUTH_DIR, 'bot_status.json');
const IPC_DIR = path.join(AUTH_DIR, '.ipc');
const OUTBOX_DIR = path.join(IPC_DIR, 'outbox');
const CMD_DIR = path.join(IPC_DIR, 'cmd');
const RESULTS_DIR = path.join(IPC_DIR, 'results');
const INTERNAL_META_FILES = new Set(['bot.lock', 'bot_status.json', '.ipc']);

const SAFE_AUTH_FILENAME_RE = /^[a-zA-Z0-9._@-]+$/;

function sanitizeSessionFileMap(filesObj) {
  if (!filesObj || typeof filesObj !== 'object' || Array.isArray(filesObj)) {
    throw new Error('Invalid session file bundle.');
  }
  const clean = {};
  for (const [name, content] of Object.entries(filesObj)) {
    if (
      typeof name !== 'string' ||
      INTERNAL_META_FILES.has(name) ||
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

function isPidAlive(pid) {
  if (!pid || typeof pid !== 'number') return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e && e.code === 'EPERM';
  }
}

class BaileysManager {
  constructor() {
    this.sock = null;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
    this.qrDataUrl = null;
    this.rawQR = null;
    this.pairingCode = null;
    this.connectedUser = null;
    this.reconnectAttempts = 0;
    this.replacedRetries = 0;
    this.conflictDetected = false;
    this.reconnectTimer = null;
    this.watchdogTimer = null;
    this.ipcTimer = null;
    this.isProcessingIpc = false;
    this.isConnecting = false;
    this.initPromise = null;
    this.lastError = null;
    this.logger = pino({ level: 'silent' });
  }

  _ensureIpcDirs() {
    for (const dir of [IPC_DIR, OUTBOX_DIR, CMD_DIR, RESULTS_DIR]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  _clearAuthFilesOnly() {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
      return;
    }
    for (const entry of fs.readdirSync(AUTH_DIR)) {
      if (INTERNAL_META_FILES.has(entry)) continue;
      fs.rmSync(path.join(AUTH_DIR, entry), { recursive: true, force: true });
    }
  }

  _hasActiveSiblingWorker() {
    try {
      if (!fs.existsSync(LOCK_FILE)) return false;
      const lock = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      if (!lock || lock.pid === process.pid) return false;
      const fresh = Date.now() - Number(lock.updatedAt || 0) < 25000;
      return fresh && isPidAlive(lock.pid);
    } catch {
      return false;
    }
  }

  _refreshWorkerLockAndStatus() {
    try {
      if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
      fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, updatedAt: Date.now() }), 'utf8');
      fs.writeFileSync(
        STATUS_FILE,
        JSON.stringify({
          pid: process.pid,
          status: this.status,
          connectedUser: this.connectedUser,
          lastError: this.lastError,
          conflictDetected: this.conflictDetected,
          pairingCode: this.pairingCode,
          hasQR: !!this.qrDataUrl,
          qr: this.qrDataUrl,
          updatedAt: Date.now(),
        }),
        'utf8'
      );
    } catch {
      // ignore lock file write errors
    }
  }

  _clearWorkerLock() {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        const lock = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
        if (lock?.pid === process.pid) fs.unlinkSync(LOCK_FILE);
      }
    } catch {
      // ignore
    }
  }

  _writeAuthFiles(fileMap) {
    const cleanFiles = sanitizeSessionFileMap(fileMap);
    this._clearAuthFilesOnly();
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
      if (INTERNAL_META_FILES.has(name) || !fs.statSync(fp).isFile() || !SAFE_AUTH_FILENAME_RE.test(name)) continue;
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
    if (this._hasActiveSiblingWorker()) {
      const ipcRes = await this._delegateToOwner('cmd', { action: 'importAuth', payload }, 20000);
      if (ipcRes?.ok) return ipcRes.result;
      if (ipcRes?.error) throw new Error(ipcRes.error);
    }
    return this._importAuthStateLocal(payload);
  }

  async _importAuthStateLocal(payload) {
    let fileMap = null;
    if (payload && typeof payload.archiveGzBase64 === 'string' && payload.archiveGzBase64.trim()) {
      const jsonStr = zlib.gunzipSync(Buffer.from(payload.archiveGzBase64.trim(), 'base64')).toString('utf8');
      fileMap = JSON.parse(jsonStr);
    } else if (payload && payload.files && typeof payload.files === 'object') {
      fileMap = payload.files;
    } else {
      throw new Error('Provide a valid baileys_auth_backup.json payload.');
    }

    await this.cleanupSocket();
    this.isConnecting = false;
    this.status = 'disconnected';
    this.qrDataUrl = null;
    this.rawQR = null;
    this.pairingCode = null;
    this.connectedUser = null;
    this.reconnectAttempts = 0;
    this.replacedRetries = 0;
    this.conflictDetected = false;
    this.lastError = null;

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
          : `Imported ${importedFiles} session files. Bot status: ${this.status}`,
    };
  }

  async cleanupSocket() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.sock) {
      const prevSock = this.sock;
      this.sock = null;
      try {
        prevSock.ev.removeAllListeners('connection.update');
        prevSock.ev.removeAllListeners('creds.update');
        prevSock.ev.removeAllListeners('messages.upsert');
        await Promise.race([
          Promise.resolve(prevSock.end(undefined)),
          new Promise((r) => setTimeout(r, 1500)),
        ]);
        await new Promise((r) => setTimeout(r, 300));
      } catch {
        // ignore errors during cleanup
      }
    }
  }

  _writeIpcResult(reqId, payload) {
    try {
      this._ensureIpcDirs();
      const tmpPath = path.join(RESULTS_DIR, `${reqId}.tmp`);
      const finalPath = path.join(RESULTS_DIR, `${reqId}.json`);
      fs.writeFileSync(tmpPath, JSON.stringify(payload), 'utf8');
      fs.renameSync(tmpPath, finalPath);
    } catch (err) {
      console.warn('[Baileys IPC] Failed to write IPC result:', err.message);
    }
  }

  async _delegateToOwner(kind, payload, timeoutMs = 15000) {
    this._ensureIpcDirs();
    const id = `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
    const targetDir = kind === 'cmd' ? CMD_DIR : OUTBOX_DIR;
    const reqPath = path.join(targetDir, `${id}.json`);
    const tmpReqPath = path.join(targetDir, `${id}.tmp`);
    const resPath = path.join(RESULTS_DIR, `${id}.json`);

    fs.writeFileSync(tmpReqPath, JSON.stringify({ id, ...payload, createdAt: Date.now() }), 'utf8');
    fs.renameSync(tmpReqPath, reqPath);

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (fs.existsSync(resPath)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(resPath, 'utf8'));
          fs.unlinkSync(resPath);
          return parsed;
        } catch {
          // wait a tick if partially written
        }
      }
      if (!this._hasActiveSiblingWorker()) {
        // Owner exited or released lock; clean up pending request so caller can take over
        try { if (fs.existsSync(reqPath)) fs.unlinkSync(reqPath); } catch { /* ignore */ }
        return null;
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    try { if (fs.existsSync(reqPath)) fs.unlinkSync(reqPath); } catch { /* ignore */ }
    return { ok: false, error: 'Timed out waiting for primary WhatsApp worker response.' };
  }

  async _processIpcQueues() {
    if (this.isProcessingIpc || this._hasActiveSiblingWorker()) return;
    this.isProcessingIpc = true;
    try {
      this._ensureIpcDirs();

      const cmdFiles = fs.readdirSync(CMD_DIR).filter((f) => f.endsWith('.json')).sort();
      for (const file of cmdFiles) {
        const fp = path.join(CMD_DIR, file);
        let req;
        try {
          req = JSON.parse(fs.readFileSync(fp, 'utf8'));
          fs.unlinkSync(fp);
        } catch {
          continue;
        }
        try {
          let result;
          if (req.action === 'restart') {
            await this.init(true);
            result = { success: true, message: 'WhatsApp bot connection restarted.' };
          } else if (req.action === 'logout') {
            result = await this._logoutLocal();
          } else if (req.action === 'importAuth') {
            result = await this._importAuthStateLocal(req.payload);
          } else if (req.action === 'pairCode') {
            result = await this._requestPairingCodeLocal(req.phone);
          } else {
            throw new Error(`Unknown IPC command: ${req.action}`);
          }
          this._writeIpcResult(req.id, { ok: true, result });
        } catch (err) {
          this._writeIpcResult(req.id, { ok: false, error: err.message });
        }
      }

      const outboxFiles = fs.readdirSync(OUTBOX_DIR).filter((f) => f.endsWith('.json')).sort();
      for (const file of outboxFiles) {
        const fp = path.join(OUTBOX_DIR, file);
        let req;
        try {
          req = JSON.parse(fs.readFileSync(fp, 'utf8'));
          fs.unlinkSync(fp);
        } catch {
          continue;
        }
        try {
          const result = await this._sendTextMessageLocal(req.cleanPhone, req.messageText);
          this._writeIpcResult(req.id, { ok: true, result });
        } catch (err) {
          this._writeIpcResult(req.id, { ok: false, error: err.message });
        }
      }
    } catch {
      // ignore transient filesystem race errors
    } finally {
      this.isProcessingIpc = false;
    }
  }

  _cleanupStaleIpcFiles() {
    try {
      const now = Date.now();
      for (const dir of [OUTBOX_DIR, CMD_DIR, RESULTS_DIR]) {
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir)) {
          const fp = path.join(dir, f);
          const stat = fs.statSync(fp);
          if (now - stat.mtimeMs > 90000) {
            fs.rmSync(fp, { force: true });
          }
        }
      }
    } catch {
      // ignore cleanup errors
    }
  }

  startIpcLoop() {
    if (this.ipcTimer) return;
    const tick = async () => {
      this.ipcTimer = null;
      await this._processIpcQueues();
      if (!this._hasActiveSiblingWorker()) {
        this.ipcTimer = setTimeout(tick, 350);
        if (typeof this.ipcTimer.unref === 'function') this.ipcTimer.unref();
      }
    };
    this.ipcTimer = setTimeout(tick, 350);
    if (typeof this.ipcTimer.unref === 'function') {
      this.ipcTimer.unref();
    }
  }

  startWatchdog() {
    this.startIpcLoop();
    if (this.watchdogTimer) return;
    this.watchdogTimer = setInterval(() => {
      try {
        if (this._hasActiveSiblingWorker()) return;
        this._refreshWorkerLockAndStatus();
        this._cleanupStaleIpcFiles();
        this.startIpcLoop();
        const hasCreds = fs.existsSync(path.join(AUTH_DIR, 'creds.json'));
        if (!hasCreds) return;
        const wsClosed = this.sock?.ws && this.sock.ws.isOpen === false;
        if (
          (this.status === 'connected' && wsClosed) ||
          (this.status === 'disconnected' && !this.isConnecting && !this.reconnectTimer && !this.conflictDetected && this.replacedRetries < 2)
        ) {
          console.log('[Baileys Watchdog] Detected dropped socket while session exists — triggering clean auto-reconnect...');
          this.init(false);
        }
      } catch {
        // ignore watchdog errors
      }
    }, 10000);
    if (typeof this.watchdogTimer.unref === 'function') {
      this.watchdogTimer.unref();
    }
  }

  async init(force = false) {
    if (this.initPromise) {
      if (!force) return this.initPromise;
      await this.initPromise.catch(() => {});
    }
    this.initPromise = this._doInit(force).finally(() => {
      this.initPromise = null;
    });
    return this.initPromise;
  }

  async _doInit(force = false) {
    if (!makeWASocket || !useMultiFileAuthState) {
      console.error('[Baileys] Module not properly loaded.');
      return;
    }

    if (this._hasActiveSiblingWorker()) {
      console.log('[Baileys] Another active worker already holds the WhatsApp lock — standing by to avoid 440 conflict.');
      return;
    }

    if (this.isConnecting && !force) {
      console.log('[Baileys] Connection initialization already in progress, skipping duplicate call.');
      return;
    }

    if (force) {
      this.conflictDetected = false;
      this.replacedRetries = 0;
      this.reconnectAttempts = 0;
      this.lastError = null;
    }

    this.isConnecting = true;
    await this.cleanupSocket();

    try {
      this.restoreFromEnvIfNeeded();
      this.status = 'connecting';
      this._refreshWorkerLockAndStatus();
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
            this._refreshWorkerLockAndStatus();
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
          const isRestartRequired = statusCode === DisconnectReason?.restartRequired || statusCode === 515;
          this.lastError = lastDisconnect?.error?.message
            ? `${lastDisconnect.error.message}${statusCode ? ` (code ${statusCode})` : ''}`
            : (statusCode ? `Disconnect code ${statusCode}` : 'Connection closed');

          console.log(`[Baileys] Connection closed. Reason code: ${statusCode}. Logged out? ${isLoggedOut}. Replaced? ${isReplaced}`);

          if (isLoggedOut) {
            console.log('[Baileys] Device logged out (401). Clearing auth directory to generate fresh QR...');
            try {
              this._clearAuthFilesOnly();
            } catch (rmErr) {
              console.error('[Baileys] Error clearing auth dir:', rmErr.message);
            }
            this.conflictDetected = false;
            this.pairingCode = null;
            this.reconnectTimer = setTimeout(() => this.init(false), 1500);
          } else if (isRestartRequired) {
            this.lastError = null;
            this.reconnectAttempts = 0;
            this.status = 'connecting';
            console.log('[Baileys] Restart required (515) — reconnecting immediately in 400ms...');
            this.reconnectTimer = setTimeout(() => this.init(false), 400);
          } else if (isReplaced) {
            if (this.replacedRetries < 2) {
              const waitMs = this.replacedRetries === 0 ? 5000 : 12000;
              this.replacedRetries++;
              console.warn(`[Baileys] Connection replaced (440) — waiting ${waitMs / 1000}s in case an old deployment worker is shutting down...`);
              this.reconnectTimer = setTimeout(() => this.init(false), waitMs);
            } else {
              this.conflictDetected = true;
              this.lastError = 'Another active server or session is using this same WhatsApp device ID (440 Conflict). Generate a fresh QR or 8-digit Pairing Code below to dedicate a new device slot to this server.';
              console.warn('[Baileys] Persistent 440 conflict detected — stopping auto-reconnect loop to prevent ping-pong kicks.');
            }
          } else {
            // Transient network disconnect
            const delay = Math.min(15000, (this.reconnectAttempts + 1) * 2500);
            this.reconnectAttempts++;
            console.log(`[Baileys] Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})...`);
            this.reconnectTimer = setTimeout(() => this.init(false), delay);
          }
          this._refreshWorkerLockAndStatus();
        } else if (connection === 'open') {
          this.isConnecting = false;
          this.status = 'connected';
          this.qrDataUrl = null;
          this.rawQR = null;
          this.pairingCode = null;
          this.lastError = null;
          this.conflictDetected = false;
          this.reconnectAttempts = 0;
          this.replacedRetries = 0;

          const userJid = this.sock.user?.id || '';
          const phone = userJid.split(':')[0] || userJid.split('@')[0];
          this.connectedUser = phone;
          this._refreshWorkerLockAndStatus();

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
      this._refreshWorkerLockAndStatus();
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
    if (this._hasActiveSiblingWorker()) {
      try {
        if (fs.existsSync(STATUS_FILE)) {
          const shared = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
          return {
            ...shared,
            hasSession: fs.existsSync(path.join(AUTH_DIR, 'creds.json')),
          };
        }
      } catch {
        // fallback to local memory state
      }
    }
    return {
      status: this.status,
      connectedUser: this.connectedUser,
      hasSession: fs.existsSync(path.join(AUTH_DIR, 'creds.json')),
      lastError: this.lastError,
      conflictDetected: this.conflictDetected,
      pairingCode: this.pairingCode,
      hasQR: !!this.qrDataUrl,
      qr: this.qrDataUrl,
    };
  }

  async restart() {
    if (this._hasActiveSiblingWorker()) {
      const ipcRes = await this._delegateToOwner('cmd', { action: 'restart' }, 15000);
      if (ipcRes?.ok) return ipcRes.result;
      if (ipcRes?.error) throw new Error(ipcRes.error);
    }
    await this.init(true);
    return { success: true, message: 'WhatsApp bot connection restarted.' };
  }

  async requestPairingCode(rawPhone) {
    if (this._hasActiveSiblingWorker()) {
      const ipcRes = await this._delegateToOwner('cmd', { action: 'pairCode', phone: rawPhone }, 15000);
      if (ipcRes?.ok) return ipcRes.result;
      if (ipcRes?.error) throw new Error(ipcRes.error);
    }
    return this._requestPairingCodeLocal(rawPhone);
  }

  async _requestPairingCodeLocal(rawPhone) {
    let digits = String(rawPhone || '').replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('920') && digits.length >= 13) digits = '92' + digits.slice(3);
    if (digits.startsWith('0') && digits.length >= 10 && digits.length <= 11) digits = '92' + digits.slice(1);
    if (digits.length === 10 && digits.startsWith('3')) digits = '92' + digits;
    if (digits.length < 10) {
      throw new Error('Enter a valid WhatsApp phone number with country code (e.g. 03269589597 or 923269589597).');
    }

    await this.cleanupSocket();
    try {
      this._clearAuthFilesOnly();
    } catch {
      // ignore
    }
    this.status = 'disconnected';
    this.connectedUser = null;
    this.qrDataUrl = null;
    this.pairingCode = null;
    this.conflictDetected = false;
    this.lastError = null;
    this.replacedRetries = 0;
    this.reconnectAttempts = 0;

    // Start fresh socket without awaiting indefinitely
    this.init(true);
    const start = Date.now();
    while (!this.sock && Date.now() - start < 5000) {
      await new Promise((r) => setTimeout(r, 150));
    }
    if (!this.sock || typeof this.sock.requestPairingCode !== 'function') {
      throw new Error('WhatsApp socket not ready for pairing code. Please try again.');
    }
    // Small wait so Noise handshake / WA WS is open before pairing request
    await new Promise((r) => setTimeout(r, 1800));
    const code = await this.sock.requestPairingCode(digits);
    this.pairingCode = code;
    this._refreshWorkerLockAndStatus();
    return {
      success: true,
      code,
      phone: digits,
      message: `Enter code ${code} in WhatsApp -> Linked Devices -> Link with phone number instead.`,
    };
  }

  async logout() {
    if (this._hasActiveSiblingWorker()) {
      const ipcRes = await this._delegateToOwner('cmd', { action: 'logout' }, 15000);
      if (ipcRes?.ok) return ipcRes.result;
      if (ipcRes?.error) throw new Error(ipcRes.error);
    }
    return this._logoutLocal();
  }

  async _logoutLocal() {
    await this.cleanupSocket();
    try {
      this._clearAuthFilesOnly();
    } catch (e) {
      // ignore
    }
    this.status = 'disconnected';
    this.connectedUser = null;
    this.qrDataUrl = null;
    this.pairingCode = null;
    this.conflictDetected = false;
    this.lastError = null;
    this.reconnectAttempts = 0;
    this.replacedRetries = 0;
    this._refreshWorkerLockAndStatus();
    setTimeout(() => this.init(true), 1200);
    return { success: true, message: 'Logged out successfully' };
  }

  async shutdown() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.ipcTimer) {
      clearTimeout(this.ipcTimer);
      this.ipcTimer = null;
    }
    await this.cleanupSocket();
    this._clearWorkerLock();
  }

  async sendTextMessage(cleanPhone, messageText) {
    if (this._hasActiveSiblingWorker()) {
      const ipcRes = await this._delegateToOwner('outbox', { cleanPhone, messageText }, 15000);
      if (ipcRes?.ok) return ipcRes.result;
      if (ipcRes?.error && this._hasActiveSiblingWorker()) {
        return { success: false, reason: ipcRes.error };
      }
      // If sibling exited mid-wait, fall through and send locally
    }
    return this._sendTextMessageLocal(cleanPhone, messageText);
  }

  async _sendTextMessageLocal(cleanPhone, messageText) {
    const hasCreds = fs.existsSync(path.join(AUTH_DIR, 'creds.json'));
    if (this.status === 'disconnected' && hasCreds && !this.conflictDetected && !this.isConnecting) {
      this.init(false);
    }

    if (this.status === 'connecting' || this.isConnecting || this.reconnectTimer || (this.status === 'disconnected' && hasCreds && !this.conflictDetected)) {
      console.log('[Baileys] Bot is connecting/reconnecting... waiting up to 10s before dispatching message.');
      await this.waitForConnection(10000);
    }

    if (this.status === 'connected' && this.sock?.ws && this.sock.ws.isOpen === false) {
      console.log('[Baileys] Detected closed WebSocket before send — reconnecting cleanly...');
      await this.init(true);
      await this.waitForConnection(8000);
    }

    if (!this.sock || this.status !== 'connected') {
      const liveStatus = this.getStatus();
      console.warn(`[Baileys] Cannot send: WhatsApp bot not connected (current status: ${liveStatus.status})`);
      return {
        success: false,
        reason: liveStatus.lastError
          ? `WhatsApp bot is ${liveStatus.status} (${liveStatus.lastError})`
          : `WhatsApp bot is ${liveStatus.status}. Please check Alerts & Bot tab in Admin Panel.`,
      };
    }

    const fallbackJid = `${cleanPhone}@s.whatsapp.net`;
    let targetJid = fallbackJid;

    try {
      // Verify and resolve official JID with onWhatsApp if available
      try {
        if (typeof this.sock.onWhatsApp === 'function') {
          const results = await this.sock.onWhatsApp(cleanPhone);
          if (Array.isArray(results) && results.length > 0 && results[0]?.exists && results[0]?.jid) {
            targetJid = results[0].jid;
            console.log(`[Baileys] Verified WhatsApp target for ${cleanPhone}: ${targetJid}`);
          }
        }
      } catch (chkErr) {
        console.warn(`[Baileys] onWhatsApp lookup notice: ${chkErr.message}`);
      }

      let result;
      try {
        result = await this.sock.sendMessage(targetJid, { text: messageText });
      } catch (primaryErr) {
        if (targetJid !== fallbackJid) {
          console.warn(`[Baileys] Send via ${targetJid} failed (${primaryErr.message}); retrying fallback ${fallbackJid}...`);
          result = await this.sock.sendMessage(fallbackJid, { text: messageText });
          targetJid = fallbackJid;
        } else {
          throw primaryErr;
        }
      }

      console.log(`[Baileys] Message sent successfully to ${targetJid} (Message ID: ${result?.key?.id})`);
      return { success: true, messageId: result?.key?.id, to: targetJid };
    } catch (err) {
      console.error(`[Baileys] Failed to send message to ${cleanPhone}:`, err.message);
      return { success: false, reason: err.message, error: err.message };
    }
  }
}

const baileysManager = new BaileysManager();
module.exports = baileysManager;
