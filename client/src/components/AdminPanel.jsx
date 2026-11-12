import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Star,
  X, Plus, Edit2, Trash2, Save, RefreshCw, Check, AlertCircle, 
  Package, ShoppingCart, Truck, Clock, CheckCircle, XCircle, Search, ChevronDown, User, Phone, MapPin, ArrowLeft,
  UploadCloud, Image as ImageIcon, Flame, Sparkles, Zap, ShieldCheck, Lock, Unlock, Key, Shield,
  MessageCircle, Mail, Send, QrCode, Download
} from 'lucide-react';
import defaultProducts from '../data/defaultProducts.json';
import { API_BASE_URL, ENDPOINTS } from '../config/api';

const API_PRODUCTS = ENDPOINTS.PRODUCTS;
const API_ORDERS = ENDPOINTS.ORDERS;

const ORDER_STATUSES = ['Pending', 'Dispatched', 'Return'];

const STATUS_CONFIG = {
  Pending: { bg: 'bg-amber-50 text-amber-800 border-amber-300', icon: Clock },
  Dispatched: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: Truck },
  Return: { bg: 'bg-rose-50 text-rose-800 border-rose-300', icon: XCircle },
};

const normalizeOrderStatus = (raw) => {
  if (raw === 'Dispatched' || raw === 'Dispached' || raw === 'Shipped' || raw === 'Delivered') return 'Dispatched';
  if (raw === 'Return' || raw === 'Cancelled') return 'Return';
  return 'Pending';
};

const formatPkr = (amount) => `Rs. ${Math.round(Number(amount) || 0).toLocaleString()}`;

const buildOrderWaUrl = (ord) => {
  const raw = String(ord?.customer?.phone || '').replace(/\D/g, '');
  if (!raw) return null;
  let digits = raw;
  if (digits.startsWith('0092')) digits = digits.slice(2);
  if (digits.startsWith('920') && digits.length >= 13) digits = '92' + digits.slice(3);
  if (digits.startsWith('0')) digits = '92' + digits.slice(1);
  if (digits.length === 10 && digits.startsWith('3')) digits = '92' + digits;
  const st = normalizeOrderStatus(ord?.status);
  const itemsText = (ord?.items || [])
    .map((it) => {
      const col = it.selectedColor || it.color;
      return `• ${it.name}${col ? ` [Color: ${col}]` : ''} (Qty: ${it.qty})`;
    })
    .join('\n');
  const msg = st === 'Dispatched'
    ? `Assalam-o-Alaikum ${ord?.customer?.name || 'Customer'}! Your CellFocus order #${ord?.orderId} has been DISPATCHED.\n\n${itemsText}\n\nTotal COD: ${formatPkr(ord?.total)} PKR.`
    : `Assalam-o-Alaikum ${ord?.customer?.name || 'Customer'}! Update on your CellFocus order #${ord?.orderId}: Status is ${st}.\n\n${itemsText}\n\nTotal: ${formatPkr(ord?.total)} PKR.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
};

export default function AdminPanel({ isOpen, onClose, onProductsChanged }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'create'
  const [products, setProducts] = useState(defaultProducts || []);
  const [orders, setOrders] = useState([]);

  // Client Reviews Management State
  const [adminReviews, setAdminReviews] = useState([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [editingReview, setEditingReview] = useState(null);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineForm, setInlineForm] = useState(null);
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);
  const [newReviewForm, setNewReviewForm] = useState({
    name: '',
    city: '',
    rating: 5,
    comment: '',
    productName: '',
    verified: true,
  });

  const fetchAdminReviews = async () => {
    try {
      const res = await fetch(ENDPOINTS.REVIEWS.GET);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAdminReviews(json.data);
      }
    } catch (err) {
      console.warn('Failed to load reviews:', err);
    }
  };

  const handleSaveReview = async (e, customData) => {
    if (e && e.preventDefault) e.preventDefault();
    const reviewData = customData || editingReview;
    if (!reviewData) return;
    const revId = reviewData.id || reviewData._id;
    try {
      const res = await fetch(ENDPOINTS.REVIEWS.UPDATE(revId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(reviewData),
      });
      const data = await res.json();
      if (data.success && data.data) {
        showToast('Client comment & review updated successfully!');
        setAdminReviews((prev) =>
          prev.map((r) => ((r.id || r._id) === revId ? data.data : r))
        );
        setEditingReview(null);
        setInlineEditId(null);
      } else {
        showToast(data.message || 'Failed to update review', 'error');
      }
    } catch (err) {
      showToast('Error updating review', 'error');
    }
  };

  const handleDeleteReview = (revId, clientName) => {
    if (!window.confirm(`Are you sure you want to permanently delete the review from "${clientName}"?`)) {
      return;
    }
    fetch(ENDPOINTS.REVIEWS.DELETE(revId), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          showToast('Review deleted successfully');
          setAdminReviews((prev) => prev.filter((r) => (r.id || r._id) !== revId));
        } else {
          showToast(data.message || 'Failed to delete review', 'error');
        }
      })
      .catch(() => showToast('Error deleting review', 'error'));
  };

  const handleAdminAddReview = async (e) => {
    e.preventDefault();
    if (!newReviewForm.comment.trim()) return;
    try {
      const res = await fetch(ENDPOINTS.REVIEWS.CREATE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newReviewForm),
      });
      const data = await res.json();
      if (data.success && data.data) {
        showToast('Client review added successfully!');
        setAdminReviews((prev) => [data.data, ...prev]);
        setIsAddReviewOpen(false);
        setNewReviewForm({ name: '', city: '', rating: 5, comment: '', productName: '', verified: true });
      } else {
        showToast(data.message || 'Failed to add review', 'error');
      }
    } catch (err) {
      showToast('Error adding review', 'error');
    }
  };
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);

  // Filters & Search
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Admin Access & Multi-Factor Authentication (MFA) State (in-memory only)
  const [sessionPasscode, setSessionPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState(null);
  const [newPasscodeInput, setNewPasscodeInput] = useState('');

  // Admin Session Token & MFA States
  const [adminToken, setAdminToken] = useState(() => {
    try {
      return sessionStorage.getItem('cf_admin_token') || '';
    } catch (e) {
      return '';
    }
  });
  const [mfaActive, setMfaActive] = useState(false);
  const [requireMfaPrompt, setRequireMfaPrompt] = useState(false);
  const [totpCodeInput, setTotpCodeInput] = useState('');
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaSetupCode, setMfaSetupCode] = useState('');
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [waStatus, setWaStatus] = useState({ status: 'disconnected', qrDataUrl: null, connectedUser: null });
  const [waTestPhone, setWaTestPhone] = useState('');
  const [waBusy, setWaBusy] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    apiKey: '',
    maskedApiKey: '',
    apiKeyConfigured: false,
    senderEmail: '',
    senderName: 'CellFocus Store Alerts',
    adminEmail: 'cellfocusc21@gmail.com',
    enabled: true,
  });
  const [emailTestAddr, setEmailTestAddr] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);

  const getAuthHeaders = () => {
    const token = adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cf_admin_token') : '') || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const getAuthOnlyHeaders = () => {
    const token = adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cf_admin_token') : '') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Sync server security status
  const fetchSecurityStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/status`);
      const data = await res.json();
      if (data.success) {
        setMfaActive(Boolean(data.mfaEnabled));
        setSecurityStatus(data);
      }
    } catch (err) {
      console.warn('Could not sync admin security status:', err);
    }
  };

  const lockAdminSession = (toastMsg = 'Admin Hub locked.') => {
    setIsAuthenticated(false);
    setAdminToken('');
    setSessionPasscode('');
    setRequireMfaPrompt(false);
    setPasscodeInput('');
    setTotpCodeInput('');
    try {
      sessionStorage.removeItem('cf_admin_token');
    } catch (e) {}
    if (toastMsg) showToast(toastMsg);
  };

  // Lock when panel is opened
  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(false);
      setPasscodeInput('');
      setTotpCodeInput('');
      setRequireMfaPrompt(false);
      setAuthError(null);
      fetchSecurityStatus();
    }
  }, [isOpen]);

  // Lock body scroll to prevent store scrollbar on the admin panel
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Product form state with Sale, Specs, 4 picture upload slots & Best Seller / Hot Deal toggles
  const [form, setForm] = useState({
    name: '',
    category: 'chargers',
    price: '',
    originalPrice: '',
    isOnSale: false,
    specs: '',
    stock: 25,
    isBestSeller: false,
    isHotDeal: false,
    image: '',
    image2: '',
    image3: '',
    image4: '',
    details: '',
  });

  // Client-side instant image processing & compression for direct file uploads
  const processImageUpload = (file, key) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setForm((prev) => ({
          ...prev,
          [key]: optimizedDataUrl,
        }));
        const slotNum = key === 'image' ? '1' : key === 'image2' ? '2' : key === 'image3' ? '3' : '4';
        showToast(`Photo ${slotNum} loaded successfully!`);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_PRODUCTS);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data);
      }
    } catch (err) {
      console.warn('Failed to load products:', err);
    }
  };

  const fetchWaStatus = async (tokenOverride) => {
    const activeToken = tokenOverride || adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cf_admin_token') : '');
    if (!activeToken) return;
    try {
      const res = await fetch(ENDPOINTS.ADMIN.WHATSAPP.STATUS, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const json = await res.json();
      if (json.success && json.data) setWaStatus(json.data);
    } catch (err) {
      console.warn('Failed to fetch WhatsApp status:', err);
    }
  };

  const fetchEmailConfig = async (tokenOverride) => {
    const activeToken = tokenOverride || adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cf_admin_token') : '');
    if (!activeToken) return;
    try {
      const res = await fetch(ENDPOINTS.ADMIN.EMAIL.CONFIG, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setEmailConfig((prev) => ({ ...prev, ...json.data, apiKey: '' }));
        if (!emailTestAddr && json.data.adminEmail) setEmailTestAddr(json.data.adminEmail);
      }
    } catch (err) {
      console.warn('Failed to fetch email config:', err);
    }
  };

  useEffect(() => {
    if (!isOpen || !isAuthenticated || activeTab !== 'alerts') return;
    fetchWaStatus();
    fetchEmailConfig();
    const interval = setInterval(() => { fetchWaStatus(); }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, isAuthenticated, activeTab]);

  const handleWaRestart = async () => {
    setWaBusy(true);
    try {
      const res = await fetch(ENDPOINTS.ADMIN.WHATSAPP.RESTART, { method: 'POST', headers: getAuthOnlyHeaders() });
      const data = await res.json();
      showToast(data.message || 'WhatsApp bot restarted. Waiting for QR...');
      setTimeout(() => fetchWaStatus(), 1500);
    } catch (err) {
      showToast('Failed to restart WhatsApp bot', 'error');
    } finally {
      setWaBusy(false);
    }
  };

  const handleWaLogout = async () => {
    if (!window.confirm('Unlink current WhatsApp device?')) return;
    setWaBusy(true);
    try {
      const res = await fetch(ENDPOINTS.ADMIN.WHATSAPP.LOGOUT, { method: 'POST', headers: getAuthOnlyHeaders() });
      const data = await res.json();
      showToast(data.message || 'WhatsApp device unlinked.');
      setTimeout(() => fetchWaStatus(), 1000);
    } catch (err) {
      showToast('Failed to unlink WhatsApp device', 'error');
    } finally {
      setWaBusy(false);
    }
  };

  const handleWaTest = async (e) => {
    e.preventDefault();
    setWaBusy(true);
    try {
      const res = await fetch(ENDPOINTS.ADMIN.WHATSAPP.TEST, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ phone: waTestPhone }),
      });
      const data = await res.json();
      if (data.success) showToast('Test WhatsApp message sent!');
      else showToast(data.reason || data.message || 'WhatsApp not connected yet', 'error');
    } catch (err) {
      showToast('Error sending test WhatsApp message', 'error');
    } finally {
      setWaBusy(false);
    }
  };

  const handleWaImportSession = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setWaBusy(true);
    try {
      const fileText = await file.text();
      const parsed = JSON.parse(fileText);
      const res = await fetch(ENDPOINTS.ADMIN.WHATSAPP.IMPORT_AUTH, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'WhatsApp session restored without QR scan!');
        fetchWaStatus();
      } else {
        showToast(data.message || 'Failed to import WhatsApp session', 'error');
      }
    } catch (err) {
      showToast('Invalid session JSON file: ' + err.message, 'error');
    } finally {
      setWaBusy(false);
    }
  };

  const handleWaExportSession = async () => {
    setWaBusy(true);
    try {
      const res = await fetch(ENDPOINTS.ADMIN.WHATSAPP.EXPORT_AUTH, {
        headers: getAuthOnlyHeaders(),
      });
      const json = await res.json();
      if (!json.success || !json.data) {
        showToast(json.message || 'No linked session found to export', 'error');
        return;
      }
      const blob = new Blob([JSON.stringify(json.data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'baileys_auth_backup.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded baileys_auth_backup.json!');
    } catch (err) {
      showToast('Failed to export WhatsApp session', 'error');
    } finally {
      setWaBusy(false);
    }
  };

  const handleWaCopyEnvToken = async () => {
    setWaBusy(true);
    try {
      const res = await fetch(`${ENDPOINTS.ADMIN.WHATSAPP.EXPORT_AUTH}?compact=1`, {
        headers: getAuthOnlyHeaders(),
      });
      const json = await res.json();
      if (!json.success || !json.data?.archiveGzBase64) {
        showToast(json.message || 'Connect WhatsApp first to copy env key', 'error');
        return;
      }
      await navigator.clipboard.writeText(json.data.archiveGzBase64);
      showToast('Copied WHATSAPP_AUTH_GZ_B64 value! Add it in Hostinger hPanel Env Vars so future deploys stay connected.');
    } catch (err) {
      showToast('Failed to copy WHATSAPP_AUTH_GZ_B64: ' + err.message, 'error');
    } finally {
      setWaBusy(false);
    }
  };

  const handleSaveEmailConfig = async (e) => {
    e.preventDefault();
    setEmailBusy(true);
    try {
      const res = await fetch(ENDPOINTS.ADMIN.EMAIL.CONFIG, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...(emailConfig.apiKey ? { apiKey: emailConfig.apiKey } : {}),
          senderEmail: emailConfig.senderEmail,
          senderName: emailConfig.senderName,
          adminEmail: emailConfig.adminEmail,
          enabled: emailConfig.enabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Brevo Email alert settings saved!');
        fetchEmailConfig();
      } else {
        showToast(data.error || data.message || 'Failed to save email settings', 'error');
      }
    } catch (err) {
      showToast('Failed to save email settings', 'error');
    } finally {
      setEmailBusy(false);
    }
  };

  const handleSendTestEmail = async () => {
    setEmailBusy(true);
    try {
      const res = await fetch(ENDPOINTS.ADMIN.EMAIL.TEST, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: emailTestAddr || emailConfig.adminEmail }),
      });
      const data = await res.json();
      if (data.success) showToast('Test email dispatched successfully!');
      else showToast(data.error || data.message || 'Failed to send test email', 'error');
    } catch (err) {
      showToast('Error sending test email', 'error');
    } finally {
      setEmailBusy(false);
    }
  };

  const handleResendOrderWhatsApp = async (ord) => {
    const st = normalizeOrderStatus(ord.status);
    const type = st === 'Pending' ? 'Placed' : st;
    try {
      const res = await fetch(ENDPOINTS.ADMIN.WHATSAPP.RESEND(ord.orderId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data?.result?.success) {
        showToast(`WhatsApp ${st} message sent to ${ord.customer?.phone}!`);
      } else {
        const waUrl = buildOrderWaUrl(ord);
        showToast(`WhatsApp bot offline (${data?.result?.reason || 'Scan QR in Alerts tab'}). Opening wa.me link...`, 'error');
        if (waUrl) window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      const waUrl = buildOrderWaUrl(ord);
      if (waUrl) window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const fetchOrders = async (tokenOverride) => {
    const activeToken = tokenOverride || adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cf_admin_token') : '');
    if (!activeToken) return;
    setLoading(true);
    try {
      const res = await fetch(API_ORDERS, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data);
      }
    } catch (err) {
      console.warn('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      if (isAuthenticated) {
        fetchOrders();
      }
    }
  }, [isOpen, isAuthenticated]);

  // Handle Order Status Change
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_ORDERS}/${orderId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        if ((newStatus === 'Dispatched' || newStatus === 'Return') && data.whatsappAutoSent === false) {
          showToast(`Order #${orderId} marked as ${newStatus}. Auto-WhatsApp not linked (use Alerts tab QR or click WhatsApp button).`);
        } else {
          showToast(`Order #${orderId} marked as ${newStatus}`);
        }
        setOrders((prev) =>
          prev.map((o) => (o.orderId === orderId || o._id === orderId ? { ...(data.data || o), status: newStatus, whatsappNoticeUrl: data.whatsappNoticeUrl } : o))
        );
      } else {
        showToast(data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Delete order #${orderId}?`)) return;
    try {
      const res = await fetch(`${API_ORDERS}/${orderId}`, {
        method: 'DELETE',
        headers: getAuthOnlyHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Order removed from tracking');
        setOrders((prev) => prev.filter((o) => o.orderId !== orderId && o._id !== orderId));
      } else {
        showToast(data.message || 'Failed to delete order', 'error');
      }
    } catch (err) {
      showToast('Failed to delete order', 'error');
    }
  };

  // Product CRUD
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return showToast('Name and Price are required', 'error');
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : 0,
        isOnSale: Boolean(form.isOnSale),
        specs: form.specs || '',
        stock: parseInt(form.stock) || 10,
        isBestSeller: Boolean(form.isBestSeller),
        isHotDeal: Boolean(form.isHotDeal),
        images: [form.image, form.image2, form.image3, form.image4].filter(Boolean),
      };
      const res = await fetch(API_PRODUCTS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast('New accessory created and published!');
        setForm({
          name: '',
          category: 'chargers',
          price: '',
          originalPrice: '',
          isOnSale: false,
          specs: '',
          stock: 25,
          isBestSeller: false,
          isHotDeal: false,
          image: '',
          image2: '',
          image3: '',
          image4: '',
          details: '',
        });
        setActiveTab('products');
        fetchProducts();
        if (onProductsChanged) onProductsChanged();
      }
    } catch (err) {
      showToast('Error creating product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (p) => {
    setEditingId(p.id || p._id);
    const img1 = p.image || (p.images && p.images[0]) || '';
    const img2 = p.image2 || (p.images && p.images[1]) || '';
    const img3 = p.image3 || (p.images && p.images[2]) || '';
    const img4 = p.image4 || (p.images && p.images[3]) || '';
    setForm({
      name: p.name,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice || '',
      isOnSale: Boolean(p.isOnSale),
      specs: p.specs || '',
      stock: p.stock || 20,
      isBestSeller: Boolean(p.isBestSeller),
      isHotDeal: Boolean(p.isHotDeal),
      image: img1,
      image2: img2,
      image3: img3,
      image4: img4,
      details: p.details || '',
    });
    setActiveTab('create');
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : 0,
        isOnSale: Boolean(form.isOnSale),
        specs: form.specs || '',
        stock: parseInt(form.stock),
        isBestSeller: Boolean(form.isBestSeller),
        isHotDeal: Boolean(form.isHotDeal),
        images: [form.image, form.image2, form.image3, form.image4].filter(Boolean),
      };
      const res = await fetch(`${API_PRODUCTS}/${editingId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Product specifications updated!');
        setEditingId(null);
        setForm({
          name: '',
          category: 'chargers',
          price: '',
          originalPrice: '',
          isOnSale: false,
          specs: '',
          stock: 25,
          isBestSeller: false,
          isHotDeal: false,
          image: '',
          image2: '',
          image3: '',
          image4: '',
          details: '',
        });
        setActiveTab('products');
        fetchProducts();
        if (onProductsChanged) onProductsChanged();
      } else {
        showToast(data.message || 'Error updating product', 'error');
      }
    } catch (err) {
      showToast('Error updating product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSale = async (id) => {
    try {
      const res = await fetch(`${API_PRODUCTS}/${id}/onsale`, {
        method: 'PATCH',
        headers: getAuthOnlyHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchProducts();
        if (onProductsChanged) onProductsChanged();
      } else {
        showToast(data.message || 'Failed to update Sale status', 'error');
      }
    } catch (err) {
      showToast('Failed to update Sale status', 'error');
    }
  };

  const handleToggleBestSeller = async (id) => {
    try {
      const res = await fetch(`${API_PRODUCTS}/${id}/bestseller`, {
        method: 'PATCH',
        headers: getAuthOnlyHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchProducts();
        if (onProductsChanged) onProductsChanged();
      } else {
        showToast(data.message || 'Failed to update Best Seller status', 'error');
      }
    } catch (err) {
      showToast('Failed to update Best Seller status', 'error');
    }
  };

  const handleToggleHotDeal = async (id) => {
    try {
      const res = await fetch(`${API_PRODUCTS}/${id}/hotdeal`, {
        method: 'PATCH',
        headers: getAuthOnlyHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchProducts();
        if (onProductsChanged) onProductsChanged();
      } else {
        showToast(data.message || 'Failed to update Hot Deal status', 'error');
      }
    } catch (err) {
      showToast('Failed to update Hot Deal status', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product from catalog?')) return;
    try {
      const res = await fetch(`${API_PRODUCTS}/${id}`, {
        method: 'DELETE',
        headers: getAuthOnlyHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Product deleted');
        fetchProducts();
        if (onProductsChanged) onProductsChanged();
      } else {
        showToast(data.message || 'Error deleting product', 'error');
      }
    } catch (err) {
      showToast('Error deleting product', 'error');
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderFilter === 'all' || normalizeOrderStatus(o.status).toLowerCase() === orderFilter.toLowerCase();
    const matchesSearch =
      !orderSearch ||
      o.orderId.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer?.phone?.includes(orderSearch);
    return matchesStatus && matchesSearch;
  });

  // Admin Authentication Handlers
  const handleVerifyPasscode = async (e) => {
    e.preventDefault();
    const entered = passcodeInput.trim();
    setAuthError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: entered }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`API unavailable (HTTP ${res.status})`);
      }
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.message || 'Invalid Master Passcode.');
        return;
      }

      setSessionPasscode(entered);

      if (data.requireMfa) {
        setRequireMfaPrompt(true);
        setAuthError(null);
        return;
      }

      if (data.token) {
        setAdminToken(data.token);
        try {
          sessionStorage.setItem('cf_admin_token', data.token);
        } catch (e) {}
      }
      setIsAuthenticated(true);
      setPasscodeInput('');
      showToast('Admin Operations Hub unlocked.');
      fetchAdminReviews();
      fetchOrders(data.token);
    } catch (err) {
      if (import.meta.env.DEV && entered === 'cellfocus2026') {
        setIsAuthenticated(true);
        setPasscodeInput('');
        showToast('Admin Hub unlocked (Dev Offline Mode).');
      } else {
        setAuthError('Admin API unreachable. Ensure the backend server is running and /api is configured.');
      }
    }
  };

  const handleVerifyMfaToken = async (e) => {
    e.preventDefault();
    const token = totpCodeInput.trim();
    if (!token || token.length < 6) {
      setAuthError('Please enter a 6-digit authentication code.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.message || 'Invalid or expired 6-digit code.');
        return;
      }

      if (data.token) {
        setAdminToken(data.token);
        try {
          sessionStorage.setItem('cf_admin_token', data.token);
        } catch (e) {}
      }
      setIsAuthenticated(true);
      setRequireMfaPrompt(false);
      setTotpCodeInput('');
      setPasscodeInput('');
      showToast('MFA Verified. Operations Hub unlocked.');
      fetchOrders(data.token);
    } catch (err) {
      setAuthError('Error verifying authenticator code.');
    }
  };

  const handleUpdatePasscode = async (e) => {
    e.preventDefault();
    const newCode = newPasscodeInput.trim();
    if (!newCode || newCode.length < 6) {
      showToast('New passcode must be at least 6 characters', 'error');
      return;
    }

    const currentCode = sessionPasscode || window.prompt('Enter your current Master Admin Passcode to confirm:') || '';
    if (!currentCode) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/change-passcode`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPasscode: currentCode,
          newPasscode: newCode,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Could not update passcode', 'error');
        return;
      }
      setSessionPasscode(newCode);
      setNewPasscodeInput('');
      showToast('Master Admin Passcode updated successfully!');
    } catch (err) {
      showToast('Could not reach backend to update passcode.', 'error');
    }
  };

  // Start MFA Setup (Fetch QR Code)
  const handleStartMfaSetup = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/mfa/setup`, { headers: getAuthOnlyHeaders() });
      const data = await res.json();
      if (data.success) {
        setMfaSetupData(data);
        setShowMfaModal(true);
        setMfaSetupCode('');
      } else {
        showToast('Failed to start MFA setup', 'error');
      }
    } catch (err) {
      showToast('Cannot connect to MFA service', 'error');
    }
  };

  // Confirm MFA Setup with first token
  const handleConfirmMfaSetup = async (e) => {
    e.preventDefault();
    if (!mfaSetupCode || mfaSetupCode.trim().length < 6) {
      showToast('Please enter the 6-digit code from your authenticator app', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/mfa/activate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ token: mfaSetupCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Invalid confirmation code', 'error');
        return;
      }

      setMfaActive(true);
      setShowMfaModal(false);
      setMfaSetupData(null);
      setMfaSetupCode('');
      showToast('Multi-Factor Authentication (MFA) is now active!');
      fetchSecurityStatus();
    } catch (err) {
      showToast('Network error activating MFA', 'error');
    }
  };

  // Disable MFA
  const handleDisableMfa = async () => {
    const entered = window.prompt('Enter your Master Admin Passcode to confirm disabling MFA:');
    if (!entered) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/mfa/disable`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ passcode: entered }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Failed to disable MFA', 'error');
        return;
      }

      setMfaActive(false);
      showToast('MFA has been disabled.');
      fetchSecurityStatus();
    } catch (err) {
      showToast('Error disabling MFA', 'error');
    }
  };

  if (!isOpen) return null;

  // Master Passcode & Multi-Factor Access Modal
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 w-full h-full bg-[#0a0c10]/92 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-[#12151c] border border-[#232936] rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#1b212d] border border-[#2a3346] flex items-center justify-center text-[#00FFFF] shadow-inner">
            {requireMfaPrompt ? <ShieldCheck className="w-6 h-6 text-[#00FFFF]" /> : <Lock className="w-6 h-6 text-[#00FFFF]" />}
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b212d] border border-[#2a3346] text-[#00FFFF] text-[10px] font-bold tracking-widest uppercase mb-1">
              <ShieldCheck className="w-3 h-3 text-[#00FFFF]" />
              <span>{requireMfaPrompt ? 'MFA Verification Step 2' : 'Restricted Access'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-light text-white tracking-tight">
              {requireMfaPrompt ? 'Two-Factor Authentication' : 'Admin Operations Hub'}
            </h2>
            <p className="text-xs text-[#9ca3af] max-w-xs mx-auto leading-relaxed">
              {requireMfaPrompt
                ? 'Open Google Authenticator or Microsoft Authenticator and enter your current 6-digit code.'
                : 'Enter your Master Admin Passcode to manage products, pricing, and live orders.'}
            </p>
          </div>

          {/* Form: Step 1 Passcode OR Step 2 TOTP Code */}
          {!requireMfaPrompt ? (
            <form onSubmit={handleVerifyPasscode} className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold text-[#cbd5e1] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#00FFFF]" />
                  <span>Master Admin Passcode</span>
                </label>
                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value);
                    setAuthError(null);
                  }}
                  placeholder="Enter passcode..."
                  autoFocus
                  className="w-full bg-[#181d26] border border-[#2d374d] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00FFFF] font-mono tracking-wider transition"
                />
                {authError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all bg-[#00FFFF] hover:bg-[#33ffff] text-[#0a0c10] shadow-[0_0_20px_rgba(0,255,255,0.25)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Unlock className="w-4 h-4" />
                <span>Verify &amp; Continue</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyMfaToken} className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold text-[#cbd5e1] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00FFFF]" />
                  <span>6-Digit Authenticator Code (TOTP)</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpCodeInput}
                  onChange={(e) => {
                    setTotpCodeInput(e.target.value.replace(/\D/g, ''));
                    setAuthError(null);
                  }}
                  placeholder="e.g. 123456"
                  autoFocus
                  className="w-full bg-[#181d26] border border-[#2d374d] rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-[#00FFFF] transition"
                />
                {authError && (
                  <p className="text-xs text-rose-400 flex items-center justify-center gap-1 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all bg-[#00FFFF] hover:bg-[#33ffff] text-[#0a0c10] shadow-[0_0_20px_rgba(0,255,255,0.25)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify MFA &amp; Unlock</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequireMfaPrompt(false);
                  setAuthError(null);
                }}
                className="w-full text-xs text-[#9ca3af] hover:text-white transition py-1"
              >
                &larr; Re-enter Master Passcode
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-[#232936] flex items-center justify-between text-xs text-[#6b7280]">
            <span className="text-[11px] text-[#6b7280]">CellFocus Protected Gateway</span>
            <button
              type="button"
              onClick={onClose}
              className="hover:text-white transition cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Store</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 w-full h-full bg-[#f6f5f0] flex flex-col overflow-hidden">
      
      {/* 1. Full-Width Top Header */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-[#e2dfd5] px-6 sm:px-12 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#1c1b18] text-white flex items-center justify-center shadow-xs">
            <Package className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#1c1b18] tracking-tight">
              CellFocus Operations Hub
            </h1>
            <p className="text-xs text-[#78746a]">
              Full Stack Inventory CRUD &bull; Order Tracking &bull; REST API
            </p>
          </div>
        </div>

        {/* Security Status & Exit Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold rounded-full font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Passcode Protected</span>
          </div>

          <button
            type="button"
            onClick={() => lockAdminSession('Admin Hub locked.')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-900 transition shadow-xs cursor-pointer"
            title="Lock Admin Panel"
          >
            <Lock className="w-3 h-3 text-amber-700" />
            <span>Lock</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full border border-[#dedad0] bg-[#f6f5f0] hover:bg-white text-xs font-semibold text-[#1c1b18] transition shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Return to Store</span>
          </button>

          <button
            onClick={onClose}
            aria-label="Close Admin"
            className="p-2 rounded-full text-[#78746a] hover:text-[#1c1b18] hover:bg-[#eeebe2] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {message && (
        <div className={`px-6 sm:px-12 py-2 text-xs font-semibold flex items-center gap-2 border-b shrink-0 transition-all ${
          message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-teal-50 text-teal-800 border-teal-200'
        }`}>
          {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 2. Full-Width Navigation Tabs Bar */}
      <div className="w-full border-b border-[#e2dfd5] bg-[#eeebe2]/70 px-6 sm:px-12 pt-3 flex items-center gap-2 sm:gap-4 shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'orders' 
              ? 'border-[#1c1b18] text-[#1c1b18]' 
              : 'border-transparent text-[#78746a] hover:text-[#1c1b18]'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Order Tracking</span>
          <span className="text-[11px] bg-[#1c1b18] text-white px-2 py-0.2 rounded-full font-mono">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('products'); setEditingId(null); }}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'products' 
              ? 'border-[#1c1b18] text-[#1c1b18]' 
              : 'border-transparent text-[#78746a] hover:text-[#1c1b18]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catalog ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'create' 
              ? 'border-[#1c1b18] text-[#1c1b18]' 
              : 'border-transparent text-[#78746a] hover:text-[#1c1b18]'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{editingId ? 'Edit Product' : 'New Product'}</span>
        </button>

        <button
          onClick={() => { setActiveTab('reviews'); fetchAdminReviews(); }}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'reviews' 
              ? 'border-[#1c1b18] text-[#1c1b18]' 
              : 'border-transparent text-[#78746a] hover:text-[#1c1b18]'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-amber-600" />
          <span>Client Reviews</span>
          <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-full font-mono font-bold">
            {adminReviews.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'alerts'
              ? 'border-[#1c1b18] text-[#1c1b18]'
              : 'border-transparent text-[#78746a] hover:text-[#1c1b18]'
          }`}
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>Alerts &amp; Bot</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'security' 
              ? 'border-[#1c1b18] text-[#1c1b18]' 
              : 'border-transparent text-[#78746a] hover:text-[#1c1b18]'
          }`}
        >
          <Shield className="w-4 h-4 text-[#0d9488]" />
          <span>Security &amp; Access</span>
        </button>
      </div>

      {/* 3. Main Workspace: Single Scroll Container */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-6 sm:px-12 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* TAB 1: ORDER TRACKING (Exact original clean list layout) */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#78746a]" />
                  <input
                    type="text"
                    placeholder="Search Order ID, customer, phone..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'Pending', 'Dispatched', 'Return'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                        orderFilter === st
                          ? 'bg-[#1c1b18] text-white'
                          : 'bg-white border border-[#dedad0] text-[#78746a] hover:text-[#1c1b18]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                  <button
                    onClick={fetchOrders}
                    className="p-1.5 rounded-lg border border-[#dedad0] bg-white text-[#78746a] hover:text-[#1c1b18] cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Order Cards Stacked List */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#e5e2d6] p-12 text-center text-xs text-[#78746a]">
                  No orders match your filter criteria.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredOrders.map((ord) => {
                    const currentStatus = normalizeOrderStatus(ord.status);
                    const cfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.Pending;
                    const waUrl = ord.whatsappNoticeUrl || buildOrderWaUrl(ord);

                    return (
                      <div
                        key={ord.orderId}
                        className="bg-white rounded-2xl border border-[#e5e2d6] p-4 shadow-2xs space-y-3"
                      >
                        {/* Order Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0eee6] pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1c1b18]">
                              #{ord.orderId}
                            </span>
                            <span className="text-[11px] text-[#78746a]">
                              • {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Status Modifier Dropdown & Quick WhatsApp Notice */}
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <select
                                value={currentStatus}
                                onChange={(e) => handleStatusChange(ord.orderId, e.target.value)}
                                className={`text-xs font-bold px-2.5 py-1 rounded-full border appearance-none pr-6 cursor-pointer focus:outline-none ${cfg.bg}`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Return">Return</option>
                              </select>
                              <ChevronDown className="w-3 h-3 absolute right-2 top-2 pointer-events-none opacity-60" />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleResendOrderWhatsApp(ord)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-semibold transition cursor-pointer"
                              title="Send / Resend WhatsApp Notification"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </button>

                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded-full border border-[#dedad0] bg-[#faf8f4] hover:bg-white text-[10px] font-semibold text-[#4a473f] transition"
                                title="Open pre-filled WhatsApp message"
                              >
                                wa.me
                              </a>
                            )}

                            <button
                              onClick={() => handleDeleteOrder(ord.orderId)}
                              className="p-1 text-[#78746a] hover:text-red-600 transition cursor-pointer"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Customer Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#4a473f] bg-[#f9f8f4] p-2.5 rounded-xl border border-[#eeebe2]">
                          <div>
                            <p className="font-bold text-[#1c1b18] flex items-center gap-1.5">
                              <User className="w-3 h-3 text-[#78746a]" />
                              {ord.customer.name}
                            </p>
                            <p className="text-[11px] text-[#78746a] flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-[#78746a]" />
                              {ord.customer.phone}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-[#78746a] flex items-start gap-1.5">
                              <MapPin className="w-3 h-3 text-[#78746a] shrink-0 mt-0.5" />
                              <span>{ord.customer.address}, {ord.customer.city}</span>
                            </p>
                          </div>
                        </div>

                        {/* Ordered Items Preview */}
                        <div className="space-y-1.5 pt-1">
                          {ord.items.map((item, idx) => {
                            const itemColor = item.selectedColor || item.color;
                            return (
                              <div key={idx} className="flex items-center justify-between text-xs py-1 gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                  <img
                                    src={item.image || 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=100&q=80'}
                                    alt={item.name}
                                    className="w-8 h-8 rounded-lg object-cover bg-[#f4f2ea] shrink-0"
                                  />
                                  <span className="font-medium text-[#1c1b18] truncate max-w-[180px] sm:max-w-xs">
                                    {item.name}
                                  </span>
                                  {itemColor && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                                      Color: {itemColor}
                                    </span>
                                  )}
                                  <span className="text-[#78746a] font-mono text-[11px] shrink-0">x{item.qty}</span>
                                </div>
                                <span className="font-mono text-[#1c1b18] shrink-0">{formatPkr(item.price * item.qty)}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Financial Total (PKR) */}
                        <div className="flex justify-between items-center border-t border-[#f0eee6] pt-2 text-xs font-bold text-[#1c1b18]">
                          <span className="text-[#78746a] font-normal">
                            Total (incl. {ord.shipping === 0 ? 'Free Shipping' : `${formatPkr(ord.shipping)} Shipping`})
                          </span>
                          <span className="font-mono text-sm">{formatPkr(ord.total)} PKR</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PRODUCT CATALOG LIST (Exact original clean list layout) */}
          {activeTab === 'products' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-[#78746a]">Manage catalog items</span>
                <button
                  onClick={fetchProducts}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#4a473f] hover:text-[#1c1b18] cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {products.length === 0 ? (
                <p className="text-xs text-[#78746a] py-8 text-center bg-white rounded-2xl border border-[#e5e2d6]">
                  No products found.
                </p>
              ) : (
                products.map((p) => {
                  const pid = p.id || p._id;
                  return (
                    <div
                      key={pid}
                      className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#e5e2d6] shadow-2xs gap-3"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={p.image || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=150&q=80'}
                          alt={p.name}
                          className="w-12 h-12 rounded-lg object-cover bg-[#eeebe2]"
                        />
                        {(p.image2 || (p.images && p.images[1])) && (
                          <img
                            src={p.image2 || p.images[1]}
                            alt="Angle view"
                            className="w-5 h-5 rounded-md object-cover border border-white absolute -bottom-1 -right-1 shadow-2xs"
                            title="2nd Photo Attached"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                            {p.category}
                          </span>
                          <span className="text-xs text-[#78746a] font-mono">Stock: {p.stock || 20}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleBestSeller(pid)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1 transition cursor-pointer border ${
                              p.isBestSeller
                                ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                : 'bg-[#f4f2ea] text-[#78746a] border-[#dedad0] hover:text-[#1c1b18]'
                            }`}
                            title="Click to toggle Best Seller status"
                          >
                            <Flame className={`w-3 h-3 ${p.isBestSeller ? 'text-amber-600 fill-amber-600' : 'text-[#8a867c]'}`} />
                            <span>{p.isBestSeller ? 'Best Seller ★' : 'Set as Best Seller'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleHotDeal(pid)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1 transition cursor-pointer border ${
                              p.isHotDeal
                                ? 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                                : 'bg-[#f4f2ea] text-[#78746a] border-[#dedad0] hover:text-[#1c1b18]'
                            }`}
                            title="Click to toggle as exclusive Hot Deal"
                          >
                            <Zap className={`w-3 h-3 ${p.isHotDeal ? 'text-rose-600 fill-rose-600' : 'text-[#8a867c]'}`} />
                            <span>{p.isHotDeal ? 'Hot Deal 🔥' : 'Make Hot Deal'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSale(pid)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1 transition cursor-pointer border ${
                              p.isOnSale
                                ? 'bg-red-100 text-red-900 border-red-300 hover:bg-red-200'
                                : 'bg-[#f4f2ea] text-[#78746a] border-[#dedad0] hover:text-[#1c1b18]'
                            }`}
                            title="Click to toggle Sale status"
                          >
                            <span>{p.isOnSale ? 'On Sale 🏷️' : 'Set Sale'}</span>
                          </button>
                        </div>
                        <h4 className="text-xs font-semibold text-[#1c1b18] truncate mt-0.5">{p.name}</h4>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xs font-mono font-bold text-[#1c1b18]">
                            {formatPkr(p.price)} PKR
                          </span>
                          {p.isOnSale && p.originalPrice > p.price && (
                            <>
                              <span className="text-[10px] font-mono text-[#9ca3af] line-through">
                                {formatPkr(p.originalPrice)}
                              </span>
                              <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                                -{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}% OFF
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 rounded-lg text-[#78746a] hover:text-[#1c1b18] hover:bg-[#eeebe2] transition cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(pid)}
                          className="p-1.5 rounded-lg text-[#78746a] hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: CREATE / EDIT PRODUCT FORM */}
          {activeTab === 'create' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e5e2d6] shadow-xs">
              <h3 className="text-sm font-bold text-[#1c1b18] mb-1">
                {editingId ? 'Edit Product Details' : 'Add New Product'}
              </h3>
              <p className="text-xs text-[#78746a] mb-5">
                Fill in the product specifications. Changes immediately update the live shop.
              </p>

              <form onSubmit={editingId ? handleUpdateProduct : handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. GaN 100W Fast Charger"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                    >
                      <option value="chargers">Chargers</option>
                      <option value="handsfree">Handsfree</option>
                      <option value="airpods">AirPods</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                    />
                  </div>
                </div>

                {/* Price & Sale Settings */}
                <div className="p-3.5 rounded-xl border border-[#dedad0] bg-[#faf8f4] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(form.isOnSale)}
                        onChange={(e) => setForm({ ...form, isOnSale: e.target.checked })}
                        className="w-4 h-4 rounded accent-rose-600 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-[#1c1b18]">Put this Product on Sale</span>
                    </label>

                    {form.isOnSale && form.originalPrice && form.price && Number(form.originalPrice) > Number(form.price) && (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full font-mono">
                        Save {formatPkr(Number(form.originalPrice) - Number(form.price))} (-{Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)}% OFF)
                      </span>
                    )}
                  </div>

                  {form.isOnSale ? (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#78746a] mb-1">
                          Old / Original Price (PKR)
                        </label>
                        <input
                          type="number"
                          step="1"
                          required={form.isOnSale}
                          value={form.originalPrice}
                          onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                          placeholder="e.g. 4500"
                          className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-rose-700 mb-1">
                          New Sale Price (PKR)
                        </label>
                        <input
                          type="number"
                          step="1"
                          required
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          placeholder="e.g. 2999"
                          className="w-full text-xs p-2.5 rounded-xl border border-rose-300 bg-white text-[#1c1b18] focus:outline-none focus:border-rose-600 font-bold font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Regular Price (PKR)</label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="e.g. 2999"
                        className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18] font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Best Seller of the Month Checkbox Toggle */}
                <div className="p-3.5 rounded-xl border border-[#dedad0] bg-[#faf8f4] hover:bg-white transition-all">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(form.isBestSeller)}
                      onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded accent-[#1c1b18] cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1c1b18]">Best Seller of the Month</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                          <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />
                          Featured
                        </span>
                      </div>
                      <p className="text-[11px] text-[#78746a] mt-0.5 leading-relaxed">
                        When checked, this accessory automatically appears in the featured <strong>Best Sellers of the Month</strong> section on the storefront.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Exclusive Hot Deal Spotlight Checkbox Toggle */}
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-all">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(form.isHotDeal)}
                      onChange={(e) => setForm({ ...form, isHotDeal: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded accent-rose-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-950">Spotlight Hot Deal of the Week</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-200/80 border border-rose-300 px-2 py-0.5 rounded-full">
                          <Zap className="w-3 h-3 text-rose-600 fill-rose-600" />
                          Exclusive Deal
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-800/80 mt-0.5 leading-relaxed">
                        Feature this item as the single exclusive <strong>Deal of the Week</strong> banner with live countdown. Selecting this automatically replaces any previously active deal.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Direct 4-Picture Device Upload Section */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1c1b18] mb-1">
                      Product Media (Up to 4 Photos)
                    </label>
                    <p className="text-[11px] text-[#78746a] mb-2.5">
                      Upload up to 4 photos directly from your computer or phone. Photo 1 is the storefront cover; Photos 2, 3, and 4 populate the smooth slide gallery in the product details view.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'image', label: 'Photo 1 (Cover)', sub: 'Primary Cover' },
                      { key: 'image2', label: 'Photo 2 (Angle)', sub: 'Hover / Side' },
                      { key: 'image3', label: 'Photo 3 (Detail)', sub: 'Features View' },
                      { key: 'image4', label: 'Photo 4 (Packaging)', sub: 'Box / Accessories' },
                    ].map((slot, index) => {
                      const val = form[slot.key];
                      return (
                        <div key={slot.key} className="flex flex-col">
                          <span className="text-[11px] font-semibold text-[#4a473f] mb-1.5 flex items-center justify-between">
                            <span className="truncate">{slot.label}</span>
                            {val && (
                              <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-mono shrink-0 ml-1">
                                Ready
                              </span>
                            )}
                          </span>

                          {val ? (
                            <div className="relative group/slot aspect-square rounded-xl border border-[#dedad0] overflow-hidden bg-[#eeebe2]">
                              <img
                                src={val}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover object-center"
                              />
                              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <label
                                  className="p-1.5 sm:p-2 rounded-full bg-white text-[#1c1b18] hover:bg-[#dedad0] cursor-pointer shadow-xs transition"
                                  title={`Change ${slot.label}`}
                                >
                                  <UploadCloud className="w-3.5 h-3.5" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) processImageUpload(e.target.files[0], slot.key);
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setForm((prev) => ({ ...prev, [slot.key]: '' }))}
                                  className="p-1.5 sm:p-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-xs transition"
                                  title={`Remove ${slot.label}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="aspect-square rounded-xl border-2 border-dashed border-[#dedad0] hover:border-[#1c1b18] bg-white hover:bg-[#faf9f5] transition flex flex-col items-center justify-center p-2.5 cursor-pointer text-center group">
                              <div className="w-8 h-8 rounded-full bg-[#f4f2ea] group-hover:bg-[#e6e4dc] flex items-center justify-center text-[#78746a] group-hover:text-[#1c1b18] mb-1.5 transition">
                                {index === 0 ? <UploadCloud className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                              </div>
                              <span className="text-xs font-semibold text-[#1c1b18] leading-tight">Upload #{index + 1}</span>
                              <span className="text-[10px] text-[#78746a] mt-0.5 line-clamp-1">{slot.sub}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) processImageUpload(e.target.files[0], slot.key);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Product Description</label>
                  <textarea
                    rows={2}
                    value={form.details}
                    onChange={(e) => setForm({ ...form, details: e.target.value })}
                    placeholder="Brief description of the product for customers..."
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>

                {/* Technical Specs Text Box */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#1c1b18]">
                      Technical Specifications
                    </label>
                    <span className="text-[10px] text-[#78746a] font-mono">One spec per line</span>
                  </div>
                  <p className="text-[11px] text-[#78746a] mb-2 leading-relaxed">
                    Type technical specs in <code className="bg-[#eeebe2] px-1 py-0.5 rounded text-[#1c1b18] font-mono">Name: Value</code> format. Only what you enter here will be displayed on the product details page.
                  </p>
                  <textarea
                    rows={5}
                    value={form.specs}
                    onChange={(e) => setForm({ ...form, specs: e.target.value })}
                    placeholder={"Battery Life: 32 Hours with Case\nBluetooth: 5.4 Low Latency\nNoise Canceling: Active ANC -38dB\nWater Resistance: IPX5 Splashproof\nCharging: Fast USB-C + Qi Wireless"}
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-[#1c1b18] hover:bg-[#32302b] text-[#f6f5f0] text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingId ? 'Save Changes' : 'Publish Product'}</span>
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setActiveTab('products'); }}
                      className="px-4 py-3 rounded-xl border border-[#dedad0] bg-white text-[#4a473f] text-xs font-medium hover:bg-[#eeebe2] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB: CLIENT REVIEWS CONTROL & MANAGEMENT SYSTEM */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e5e2d6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1c1b18] flex items-center gap-2">
                      <span>Client Reviews &amp; Testimonials Hub</span>
                      <span className="text-xs font-mono font-normal bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                        {adminReviews.length} Reviews
                      </span>
                    </h2>
                    <p className="text-xs text-[#78746a]">
                      Control customer feedback &bull; Edit reviews &amp; comments &bull; Verify buyers &bull; Delete obsolete feedback
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchAdminReviews}
                    className="p-2 rounded-xl border border-[#dedad0] bg-[#faf9f5] hover:bg-white text-[#78746a] hover:text-[#1c1b18] transition cursor-pointer"
                    title="Refresh Reviews"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddReviewOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#1c1b18] hover:bg-[#32302b] text-[#f6f5f0] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Review</span>
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#e5e2d6] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-[#78746a] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="Search by customer, city, comment..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#dedad0] bg-[#faf9f5] focus:bg-white focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  <span className="text-[11px] font-semibold text-[#78746a] mr-1">Rating:</span>
                  {['all', 5, 4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReviewRatingFilter(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        reviewRatingFilter === r
                          ? 'bg-[#1c1b18] text-white'
                          : 'bg-[#faf9f5] hover:bg-[#eeebe2] text-[#4a473f] border border-[#dedad0]'
                      }`}
                    >
                      {r === 'all' ? 'All' : `${r} ★`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reviews List */}
              {(() => {
                const filtered = adminReviews.filter((rev) => {
                  const matchSearch =
                    !reviewSearch ||
                    rev.name?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                    rev.comment?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                    rev.city?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                    rev.productName?.toLowerCase().includes(reviewSearch.toLowerCase());
                  const matchRating =
                    reviewRatingFilter === 'all' || Number(rev.rating) === Number(reviewRatingFilter);
                  return matchSearch && matchRating;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="bg-white p-8 rounded-2xl border border-[#e5e2d6] text-center space-y-2">
                      <p className="text-sm font-semibold text-[#1c1b18]">No client reviews match your filter</p>
                      <p className="text-xs text-[#78746a]">Try adjusting your search query or rating filter.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filtered.map((rev) => {
                      const revId = rev.id || rev._id;
                      return (
                        <div
                          key={revId}
                          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e5e2d6] shadow-2xs hover:border-[#dedad0] transition space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                                {(rev.name || 'C').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-xs sm:text-sm font-bold text-[#1c1b18]">{rev.name}</h3>
                                  {rev.verified && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-semibold">
                                      <ShieldCheck className="w-3 h-3 text-teal-600" />
                                      <span>Verified Buyer</span>
                                    </span>
                                  )}
                                  {rev.city && (
                                    <span className="text-[11px] text-[#78746a] font-mono">
                                      &bull; {rev.city}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center text-amber-500">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-3.5 h-3.5 ${
                                          star <= rev.rating ? 'fill-amber-400 text-amber-500' : 'text-neutral-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  {rev.productName && (
                                    <span className="text-[11px] font-semibold text-[#0d9488] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                                      {rev.productName}
                                    </span>
                                  )}
                                  {rev.date && (
                                    <span className="text-[10px] text-[#a09c91] font-mono">
                                      {new Date(rev.date).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons: Edit Comment & Delete */}
                            <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineEditId(revId);
                                  setInlineForm({ ...rev });
                                  setEditingReview({ ...rev });
                                }}
                                className="px-3 py-1.5 rounded-lg border border-[#dedad0] bg-white hover:bg-[#faf9f5] text-[#1c1b18] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                                title="Edit client comment, rating or details"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                                <span>Edit Comment</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(revId, rev.name)}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                                title="Delete Review"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Inline Editable or Display Client Comment Box */}
                          {inlineEditId === revId ? (
                            <div className="p-4 bg-amber-50/60 rounded-xl border-2 border-amber-300 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                  <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Editing Client Comment &amp; Details</span>
                                </span>
                                <span className="text-[11px] text-amber-800 font-mono">Press Save when done</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-semibold text-[#1c1b18] mb-0.5">Client Name</label>
                                  <input
                                    type="text"
                                    value={inlineForm.name}
                                    onChange={(e) => setInlineForm({ ...inlineForm, name: e.target.value })}
                                    className="w-full text-xs p-2 rounded-lg border border-[#dedad0] bg-white text-[#1c1b18]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-[#1c1b18] mb-0.5">City</label>
                                  <input
                                    type="text"
                                    value={inlineForm.city}
                                    onChange={(e) => setInlineForm({ ...inlineForm, city: e.target.value })}
                                    className="w-full text-xs p-2 rounded-lg border border-[#dedad0] bg-white text-[#1c1b18]"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-semibold text-[#1c1b18] mb-0.5">Rating (1-5 Stars)</label>
                                  <select
                                    value={inlineForm.rating}
                                    onChange={(e) => setInlineForm({ ...inlineForm, rating: Number(e.target.value) })}
                                    className="w-full text-xs p-2 rounded-lg border border-[#dedad0] bg-white text-[#1c1b18]"
                                  >
                                    <option value={5}>★★★★★ (5 Stars)</option>
                                    <option value={4}>★★★★☆ (4 Stars)</option>
                                    <option value={3}>★★★☆☆ (3 Stars)</option>
                                    <option value={2}>★★☆☆☆ (2 Stars)</option>
                                    <option value={1}>★☆☆☆☆ (1 Star)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-[#1c1b18] mb-0.5">Product</label>
                                  <input
                                    type="text"
                                    value={inlineForm.productName}
                                    onChange={(e) => setInlineForm({ ...inlineForm, productName: e.target.value })}
                                    className="w-full text-xs p-2 rounded-lg border border-[#dedad0] bg-white text-[#1c1b18]"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-[#1c1b18] mb-0.5">Client Comment (Editable)</label>
                                <textarea
                                  rows={3}
                                  value={inlineForm.comment}
                                  onChange={(e) => setInlineForm({ ...inlineForm, comment: e.target.value })}
                                  className="w-full text-xs p-2.5 rounded-lg border border-[#dedad0] bg-white text-[#1c1b18] leading-relaxed"
                                />
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-1.5 text-xs text-[#1c1b18] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(inlineForm.verified)}
                                    onChange={(e) => setInlineForm({ ...inlineForm, verified: e.target.checked })}
                                    className="rounded text-teal-600"
                                  />
                                  <span>Verified Buyer badge</span>
                                </label>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setInlineEditId(null)}
                                    className="px-3 py-1.5 rounded-lg border border-[#dedad0] bg-white hover:bg-[#faf9f5] text-xs font-semibold text-[#78746a] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveReview(null, inlineForm)}
                                    className="px-4 py-1.5 rounded-lg bg-[#1c1b18] hover:bg-[#32302b] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save Changes</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-[#faf9f5] rounded-xl border border-[#eeebe2]">
                              <p className="text-xs text-[#2b2923] leading-relaxed italic">
                                &ldquo;{rev.comment}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: WHATSAPP BOT & BREVO EMAIL ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-5">
              {/* WhatsApp Bot Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#e5e2d6] shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1c1b18]">Automated WhatsApp Bot (Baileys)</h3>
                      <p className="text-xs text-[#78746a]">
                        Link your store WhatsApp once via QR code to send automatic Placed &amp; Dispatched messages.
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase font-mono border ${
                    waStatus.status === 'connected'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : waStatus.status === 'qr_ready'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}>
                    {waStatus.status}{waStatus.connectedUser ? ` (+${waStatus.connectedUser})` : ''}
                  </span>
                </div>

                {waStatus.status !== 'connected' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-semibold">
                      {waStatus.hasSession === false
                        ? 'No WhatsApp session is stored on the live server yet — automated WhatsApp messages are currently paused.'
                        : `WhatsApp bot is ${waStatus.status} (not ready to auto-send yet).`}
                    </p>
                    {waStatus.lastError && (
                      <p className="text-[11px] font-mono text-rose-700">Last error: {waStatus.lastError}</p>
                    )}
                    <p className="text-[11px] text-amber-800">
                      Click <strong>Import Existing Session (.json)</strong> below and choose <code>server/data/baileys_auth_backup.json</code> (no QR rescan needed).
                    </p>
                  </div>
                )}

                {(waStatus.status === 'qr_ready' && (waStatus.qr || waStatus.qrDataUrl)) && (
                  <div className="p-4 rounded-xl bg-[#faf8f4] border border-[#dedad0] flex flex-col sm:flex-row items-center gap-4">
                    <img src={waStatus.qr || waStatus.qrDataUrl} alt="WhatsApp Link QR" className="w-44 h-44 rounded-xl border border-[#dedad0] bg-white p-1" />
                    <div className="space-y-2 text-xs text-[#4a473f]">
                      <p className="font-bold text-[#1c1b18] flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-emerald-600" />
                        <span>Scan QR with WhatsApp on your phone</span>
                      </p>
                      <p>Open WhatsApp &rarr; Linked Devices &rarr; Link a Device, then scan this QR code &mdash; OR upload your saved <code>baileys_auth_backup.json</code> below to connect without rescanning.</p>
                      <p className="text-[11px] text-[#78746a]">Auto-refreshing status every 5 seconds...</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fetchWaStatus()}
                    className="px-3 py-2 rounded-xl border border-[#dedad0] bg-[#faf8f4] hover:bg-white text-xs font-semibold text-[#1c1b18] flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Status</span>
                  </button>
                  <button
                    type="button"
                    disabled={waBusy}
                    onClick={handleWaRestart}
                    className="px-3 py-2 rounded-xl bg-[#1c1b18] hover:bg-[#33312b] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Restart / Generate New QR
                  </button>
                  <label className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Import Existing Session (.json)</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      disabled={waBusy}
                      onChange={handleWaImportSession}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={waBusy}
                    onClick={handleWaExportSession}
                    className="px-3 py-2 rounded-xl border border-[#dedad0] bg-[#faf8f4] hover:bg-white text-[#1c1b18] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Backup Session</span>
                  </button>
                  <button
                    type="button"
                    disabled={waBusy}
                    onClick={handleWaCopyEnvToken}
                    className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Copies compact ~4KB session value for Hostinger WHATSAPP_AUTH_GZ_B64 env var"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Copy Persistent Env Key</span>
                  </button>
                  {waStatus.status === 'connected' && (
                    <button
                      type="button"
                      disabled={waBusy}
                      onClick={handleWaLogout}
                      className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Unlink Device
                    </button>
                  )}
                </div>

                <form onSubmit={handleWaTest} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#f0eee6]">
                  <input
                    type="text"
                    value={waTestPhone}
                    onChange={(e) => setWaTestPhone(e.target.value)}
                    placeholder="Test WhatsApp phone (e.g. 03269589597)"
                    className="flex-1 text-xs p-2.5 rounded-xl border border-[#dedad0] bg-[#faf8f4] text-[#1c1b18] font-mono"
                  />
                  <button
                    type="submit"
                    disabled={waBusy}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test WhatsApp</span>
                  </button>
                </form>
              </div>

              {/* Brevo Email Alerts Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#e5e2d6] shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1c1b18]">Brevo Order &amp; Dispatch Email Alerts</h3>
                      <p className="text-xs text-[#78746a]">
                        {emailConfig.apiKeyConfigured
                          ? `API key active (${emailConfig.maskedApiKey})`
                          : 'No Brevo API key configured on this live server yet.'}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveEmailConfig} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Brevo API Key</label>
                      <input
                        type="password"
                        value={emailConfig.apiKey}
                        onChange={(e) => setEmailConfig({ ...emailConfig, apiKey: e.target.value })}
                        placeholder={emailConfig.apiKeyConfigured ? 'Leave blank to keep existing key' : 'xkeysib-...'}
                        className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-[#faf8f4] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Admin Alert Email</label>
                      <input
                        type="email"
                        required
                        value={emailConfig.adminEmail}
                        onChange={(e) => setEmailConfig({ ...emailConfig, adminEmail: e.target.value })}
                        placeholder="cellfocusc21@gmail.com"
                        className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-[#faf8f4]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Sender Email (Verified in Brevo)</label>
                      <input
                        type="email"
                        required
                        value={emailConfig.senderEmail}
                        onChange={(e) => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                        placeholder="cellfocusc21@gmail.com"
                        className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-[#faf8f4]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Sender Name</label>
                      <input
                        type="text"
                        value={emailConfig.senderName}
                        onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                        placeholder="CellFocus Store Alerts"
                        className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-[#faf8f4]"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-[#1c1b18] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(emailConfig.enabled)}
                      onChange={(e) => setEmailConfig({ ...emailConfig, enabled: e.target.checked })}
                      className="w-4 h-4 rounded accent-[#1c1b18]"
                    />
                    <span>Enable automated order &amp; dispatch email alerts</span>
                  </label>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={emailBusy}
                      className="px-4 py-2.5 rounded-xl bg-[#1c1b18] hover:bg-[#33312b] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      Save Email Settings
                    </button>
                    <input
                      type="email"
                      value={emailTestAddr}
                      onChange={(e) => setEmailTestAddr(e.target.value)}
                      placeholder="Test recipient email"
                      className="text-xs px-3 py-2 rounded-xl border border-[#dedad0] bg-[#faf8f4]"
                    />
                    <button
                      type="button"
                      disabled={emailBusy}
                      onClick={handleSendTestEmail}
                      className="px-4 py-2.5 rounded-xl border border-[#dedad0] bg-[#faf8f4] hover:bg-white text-xs font-semibold text-[#1c1b18] cursor-pointer disabled:opacity-50"
                    >
                      Send Test Email
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: MULTI-LAYER SECURITY & ACCESS CONTROL */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              
              {/* Header Box */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e5e2d6] shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#0a0c10] border border-[#232936] text-[#00FFFF] flex items-center justify-center shrink-0 shadow-xs">
                      <Shield className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1c1b18] tracking-tight">
                        Security &amp; Admin Access
                      </h3>
                      <p className="text-xs text-[#78746a] mt-0.5">
                        Master Passcode Protection &bull; Session Lockdown &bull; Access Policy
                      </p>
                    </div>
                  </div>

                  <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>AUTHENTICATED</span>
                  </span>
                </div>
              </div>

              {/* Security Controls Card */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e5e2d6] shadow-xs space-y-6">
                
                {/* 1. Multi-Factor Authentication (MFA / TOTP) Setup Card */}
                <div className="p-4 rounded-xl border border-[#dedad0] bg-[#faf8f4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#0d9488]" />
                      <span className="text-xs font-bold text-[#1c1b18]">
                        Two-Factor Authentication (MFA / TOTP)
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase ${
                        mfaActive 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {mfaActive ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-xs text-[#78746a]">
                      {mfaActive
                        ? 'Protected by Google Authenticator / Microsoft Authenticator. 6-digit TOTP code required on login.'
                        : 'Secure your admin panel with Google Authenticator or Microsoft Authenticator (RFC 6238 TOTP).'}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {!mfaActive ? (
                      <button
                        type="button"
                        onClick={handleStartMfaSetup}
                        className="px-4 py-2 bg-[#1c1b18] hover:bg-[#33312b] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00FFFF]" />
                        <span>Enable MFA</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleDisableMfa}
                        className="px-3.5 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        Disable MFA
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Update Master Passcode */}
                <div className="p-4 rounded-xl border border-[#dedad0] bg-white space-y-3">
                  <div>
                    <span className="text-xs font-bold text-[#1c1b18] flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#0d9488]" />
                      <span>Change Master Admin Passcode</span>
                    </span>
                    <p className="text-xs text-[#78746a] mt-0.5">
                      Enter a new secure passcode (at least 6 characters) to restrict Operations Hub access.
                    </p>
                  </div>

                  <form onSubmit={handleUpdatePasscode} className="flex flex-col sm:flex-row gap-2 max-w-md">
                    <input
                      type="password"
                      value={newPasscodeInput}
                      onChange={(e) => setNewPasscodeInput(e.target.value)}
                      placeholder="Enter new master passcode..."
                      className="flex-1 text-xs p-2.5 rounded-xl border border-[#dedad0] bg-[#faf8f4] text-[#1c1b18] focus:outline-none focus:border-[#1c1b18] font-mono tracking-wider"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-[#1c1b18] hover:bg-[#33312b] text-white text-xs font-semibold rounded-xl transition cursor-pointer shrink-0"
                    >
                      Update Passcode
                    </button>
                  </form>
                </div>

                {/* 3. Session Lockdown Control */}
                <div className="p-4 rounded-xl border border-[#dedad0] bg-[#faf8f4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#1c1b18] block">
                      Immediate Session Lockdown
                    </span>
                    <p className="text-xs text-[#78746a] mt-0.5">
                      Immediately terminate this active admin session and require re-authentication.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => lockAdminSession('Session locked.')}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-auto"
                  >
                    Lock Session Now
                  </button>
                </div>

                {/* 4. Production DevOps Checklist Card */}
                <div className="p-4 rounded-xl border border-[#dedad0] bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1c1b18] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#0d9488]" />
                      <span>Production Server Hardening Status</span>
                    </span>
                    {securityStatus?.clientIp && (
                      <span className="text-[11px] font-mono text-[#78746a]">
                        Detected IP: <code className="text-[#1c1b18] font-bold">{securityStatus.clientIp}</code>
                      </span>
                    )}
                  </div>
                  <ul className="text-xs text-[#666258] space-y-1.5 list-disc list-inside">
                    <li><strong className="text-[#1c1b18]">Rate Limiter Active:</strong> Max 5 login attempts / 15 mins via <code>express-rate-limit</code>.</li>
                    <li><strong className="text-[#1c1b18]">Helmet Active:</strong> Enterprise HTTP security headers enabled on all endpoints.</li>
                    <li><strong className="text-[#1c1b18]">Nginx Config Ready:</strong> Pre-configured reverse proxy &amp; IP whitelist in <code>server/deploy/nginx.conf</code>.</li>
                    <li><strong className="text-[#1c1b18]">Apache .htaccess Ready:</strong> HTTP Basic Auth &amp; security directives in <code>server/deploy/.htaccess</code>.</li>
                  </ul>
                </div>

              </div>

              {/* MFA Setup Modal */}
              {showMfaModal && mfaSetupData && (
                <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-[#dedad0] space-y-4 animate-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#1c1b18] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#0d9488]" />
                        <span>Setup Authenticator App (MFA)</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowMfaModal(false)}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-[#78746a] leading-relaxed">
                      1. Open <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> on your phone.
                      <br />
                      2. Scan the QR code below:
                    </p>

                    <div className="flex justify-center p-2 bg-[#faf8f4] border border-[#dedad0] rounded-xl">
                      <img src={mfaSetupData.qrImageUrl} alt="MFA QR Code" className="w-44 h-44 rounded-lg" />
                    </div>

                    <div className="text-[11px] font-mono text-center text-[#78746a] bg-[#eeebe2] p-2 rounded-lg break-all select-all">
                      Manual Secret: <strong>{mfaSetupData.secret}</strong>
                    </div>

                    <form onSubmit={handleConfirmMfaSetup} className="space-y-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-[#1c1b18] mb-1">
                          3. Enter 6-digit code to activate:
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={mfaSetupCode}
                          onChange={(e) => setMfaSetupCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 123456"
                          autoFocus
                          className="w-full text-center text-lg font-mono tracking-widest p-2 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowMfaModal(false)}
                          className="flex-1 py-2.5 rounded-xl border border-[#dedad0] text-xs font-semibold text-[#78746a] hover:bg-[#faf8f4]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl bg-[#1c1b18] text-white text-xs font-bold hover:bg-[#33312b] shadow-xs"
                        >
                          Verify &amp; Activate
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>


      {/* Edit Client Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#f6f5f0] border border-[#dedad0] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-white border-b border-[#dedad0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-[#1c1b18]">Edit Client Review &amp; Comment</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="p-1 rounded-lg text-[#78746a] hover:text-[#1c1b18] hover:bg-[#eeebe2] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    value={editingReview.name || ''}
                    onChange={(e) => setEditingReview({ ...editingReview, name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1c1b18] mb-1">City / Location</label>
                  <input
                    type="text"
                    required
                    value={editingReview.city || ''}
                    onChange={(e) => setEditingReview({ ...editingReview, city: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Rating</label>
                  <select
                    value={editingReview.rating || 5}
                    onChange={(e) => setEditingReview({ ...editingReview, rating: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                  >
                    <option value={5}>★★★★★ (5 Stars - Excellent)</option>
                    <option value={4}>★★★★☆ (4 Stars - Good)</option>
                    <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                    <option value={2}>★★☆☆☆ (2 Stars - Poor)</option>
                    <option value={1}>★☆☆☆☆ (1 Star - Terrible)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Product Referenced</label>
                  <input
                    type="text"
                    value={editingReview.productName || ''}
                    onChange={(e) => setEditingReview({ ...editingReview, productName: e.target.value })}
                    placeholder="e.g. CellFocus Cyber 65W GaN"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1c1b18] mb-1 flex items-center justify-between">
                  <span>Client Comment &amp; Testimonial (Editable)</span>
                  <span className="text-[11px] text-[#78746a] font-normal">Full editorial control</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingReview.comment || ''}
                  onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                  placeholder="Enter or modify the customer's comment..."
                  className="w-full text-xs p-3 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18] leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_verified_modal"
                  checked={Boolean(editingReview.verified)}
                  onChange={(e) => setEditingReview({ ...editingReview, verified: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="edit_verified_modal" className="text-xs text-[#1c1b18] font-medium cursor-pointer">
                  Display &ldquo;Verified Buyer&rdquo; badge
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#dedad0]">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 rounded-xl border border-[#dedad0] bg-white text-xs font-semibold text-[#78746a] hover:text-[#1c1b18] hover:bg-[#faf9f5] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1c1b18] hover:bg-[#32302b] text-white text-xs font-semibold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Review Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Review Modal */}
      {isAddReviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#f6f5f0] border border-[#dedad0] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-white border-b border-[#dedad0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-[#1c1b18]">Add Customer Testimonial</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddReviewOpen(false)}
                className="p-1 rounded-lg text-[#78746a] hover:text-[#1c1b18] hover:bg-[#eeebe2] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminAddReview} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    value={newReviewForm.name}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, name: e.target.value })}
                    placeholder="e.g. Hamza Tariq"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1c1b18] mb-1">City / Region</label>
                  <input
                    type="text"
                    required
                    value={newReviewForm.city}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, city: e.target.value })}
                    placeholder="e.g. Lahore, Karachi, Islamabad"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Star Rating</label>
                  <select
                    value={newReviewForm.rating}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, rating: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                  >
                    <option value={5}>★★★★★ (5 Stars)</option>
                    <option value={4}>★★★★☆ (4 Stars)</option>
                    <option value={3}>★★★☆☆ (3 Stars)</option>
                    <option value={2}>★★☆☆☆ (2 Stars)</option>
                    <option value={1}>★☆☆☆☆ (1 Star)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Product (Optional)</label>
                  <input
                    type="text"
                    value={newReviewForm.productName}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, productName: e.target.value })}
                    placeholder="e.g. CellFocus AirDots Pro 3"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1c1b18] mb-1">Customer Comment</label>
                <textarea
                  rows={4}
                  required
                  value={newReviewForm.comment}
                  onChange={(e) => setNewReviewForm({ ...newReviewForm, comment: e.target.value })}
                  placeholder="Type the customer's comment or feedback..."
                  className="w-full text-xs p-3 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18] leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="add_verified_modal"
                  checked={newReviewForm.verified}
                  onChange={(e) => setNewReviewForm({ ...newReviewForm, verified: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="add_verified_modal" className="text-xs text-[#1c1b18] font-medium cursor-pointer">
                  Mark as &ldquo;Verified Buyer&rdquo;
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#dedad0]">
                <button
                  type="button"
                  onClick={() => setIsAddReviewOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#dedad0] bg-white text-xs font-semibold text-[#78746a] hover:text-[#1c1b18] hover:bg-[#faf9f5] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1c1b18] hover:bg-[#32302b] text-white text-xs font-semibold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publish Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
