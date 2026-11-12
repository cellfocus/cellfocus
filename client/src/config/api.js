/**
 * CellFocus API Configuration
 * Dynamically resolves API endpoints across Local Development, Hostinger VPS, and Production.
 *
 * In Production behind an Nginx reverse proxy, relative paths ('') ensure all requests
 * route seamlessly via HTTPS through the same domain without CORS or mixed-content issues.
 */

const getApiBaseUrl = () => {
  // If explicitly configured via Vite environment variable
  if (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '') {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }

  // In production browser environments, use relative URLs (Nginx proxies /api to port 5000)
  if (import.meta.env.PROD) {
    return '';
  }

  // In local development, fallback to local backend port
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// Pre-configured resource endpoints
export const ENDPOINTS = {
  PRODUCTS: `${API_BASE_URL}/api/products`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  ORDER_TRACK: (query) => `${API_BASE_URL}/api/orders/track/${encodeURIComponent(query)}`,
  RATES: `${API_BASE_URL}/api/rates`,
  ADMIN: {
    STATUS: `${API_BASE_URL}/api/admin/status`,
    LOGIN: `${API_BASE_URL}/api/admin/login`,
    MFA_VERIFY: `${API_BASE_URL}/api/admin/mfa/verify`,
    MFA_SETUP: `${API_BASE_URL}/api/admin/mfa/setup`,
    MFA_ACTIVATE: `${API_BASE_URL}/api/admin/mfa/activate`,
    MFA_DISABLE: `${API_BASE_URL}/api/admin/mfa/disable`,
    CHANGE_PASSCODE: `${API_BASE_URL}/api/admin/change-passcode`,
    FORGOT_PASSCODE: `${API_BASE_URL}/api/admin/forgot-passcode`,
    RESET_PASSCODE: `${API_BASE_URL}/api/admin/reset-passcode`,
    RATES: `${API_BASE_URL}/api/admin/rates`,
    WHATSAPP: {
      STATUS: `${API_BASE_URL}/api/admin/whatsapp/status`,
      RESTART: `${API_BASE_URL}/api/admin/whatsapp/restart`,
      LOGOUT: `${API_BASE_URL}/api/admin/whatsapp/logout`,
      TEST: `${API_BASE_URL}/api/admin/whatsapp/test`,
      RESEND: (id) => `${API_BASE_URL}/api/admin/whatsapp/resend/${encodeURIComponent(id)}`,
      EXPORT_AUTH: `${API_BASE_URL}/api/admin/whatsapp/export-auth`,
      IMPORT_AUTH: `${API_BASE_URL}/api/admin/whatsapp/import-auth`,
      PAIR_CODE: `${API_BASE_URL}/api/admin/whatsapp/pair-code`,
    },
    EMAIL: {
      CONFIG: `${API_BASE_URL}/api/admin/email/config`,
      TEST: `${API_BASE_URL}/api/admin/email/test`,
      RESEND: (id) => `${API_BASE_URL}/api/admin/email/resend/${encodeURIComponent(id)}`,
    },
  },
  UPLOAD: {
    IMAGE: `${API_BASE_URL}/api/upload/image`,
    DELETE: `${API_BASE_URL}/api/upload/delete`,
  },
  REVIEWS: {
    GET: `${API_BASE_URL}/api/reviews`,
    CREATE: `${API_BASE_URL}/api/reviews`,
    UPDATE: (id) => `${API_BASE_URL}/api/reviews/${encodeURIComponent(id)}`,
    DELETE: (id) => `${API_BASE_URL}/api/reviews/${encodeURIComponent(id)}`,
  },
};

export default ENDPOINTS;

