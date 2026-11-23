import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  ChevronRight, 
  Check, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  MessageSquare, 
  Building2, 
  ArrowLeft,
  Zap,
  Cable,
  Usb
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import WhatsAppButton from '../components/WhatsAppButton';
import { useCurrency } from '../context/CurrencyContext';
import defaultProducts from '../data/defaultProducts.json';
import { ENDPOINTS } from '../config/api';
import { slugify, CATEGORY_SEO } from '../config/seoConfig';

export default function ProductPage({
  onAddToCart,
  onBuyNow,
  onOpenCart,
  onOpenAdmin,
  onOpenTracking,
  cartCount = 0,
}) {
  const { slugWithId } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const [products, setProducts] = useState(defaultProducts);
  const [product, setProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [qty, setQty] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Load products list
  useEffect(() => {
    fetch(ENDPOINTS.PRODUCTS)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.data || defaultProducts);
        if (Array.isArray(list) && list.length > 0) {
          setProducts(list);
        }
      })
      .catch(() => {});
  }, []);

  // Resolve matching product from slugWithId
  useEffect(() => {
    if (!slugWithId || !products.length) return;

    const lastHyphen = slugWithId.lastIndexOf('-');
    const potentialId = lastHyphen > -1 ? slugWithId.slice(lastHyphen + 1) : slugWithId;

    let found = products.find((p) => String(p.id || p._id) === String(potentialId));
    if (!found) {
      found = products.find((p) => `${slugify(p.name)}-${p.id || p._id}` === slugWithId);
    }
    if (!found) {
      found = products.find((p) => slugify(p.name) === slugWithId);
    }

    if (found) {
      setProduct(found);
      setActiveImageIndex(0);
      const defaultColor = Array.isArray(found.colors) && found.colors[0]?.name ? found.colors[0].name : null;
      setSelectedColor(defaultColor);
      const defaultConnector = Array.isArray(found.connectorTypes) && found.connectorTypes[0] ? found.connectorTypes[0] : null;
      setSelectedConnector(defaultConnector);
    } else {
      setProduct(null);
    }
  }, [slugWithId, products]);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] text-[#1c1b18] flex flex-col font-sans">
        <Navbar
          cartCount={cartCount}
          onCategoryClick={() => {}}
          onOpenCart={onOpenCart}
          onOpenAdmin={onOpenAdmin}
          onOpenTracking={onOpenTracking}
        />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-extrabold mb-4">Product Not Found</h1>
          <p className="text-[#78746a] text-sm mb-8">
            The mobile accessory you are looking for is currently unavailable or has moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1c1b18] text-[#f7f4ec] font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Store Catalog
          </Link>
        </main>
        <Footer onCategoryClick={() => {}} onOpenAdmin={onOpenAdmin} />
      </div>
    );
  }

  // Build image gallery
  const gallery = [];
  if (product.image) gallery.push(product.image);
  if (product.image2 && !gallery.includes(product.image2)) gallery.push(product.image2);
  if (product.image3 && !gallery.includes(product.image3)) gallery.push(product.image3);
  if (product.image4 && !gallery.includes(product.image4)) gallery.push(product.image4);
  if (Array.isArray(product.images)) {
    product.images.forEach((img) => {
      if (img && !gallery.includes(img)) gallery.push(img);
    });
  }
  if (gallery.length === 0) {
    gallery.push('https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80');
  }

  const categorySlug = (product.category || 'chargers').toLowerCase();
  const categoryConfig = CATEGORY_SEO[categorySlug] || { name: 'Accessories', canonical: '/#products' };

  // Price calculations
  const priceNum = Number(product.price) || 0;
  const originalPriceNum = Number(product.originalPrice) || 0;
  const hasDiscount = Boolean(product.isOnSale) && originalPriceNum > priceNum;
  const discountPercent = hasDiscount ? Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100) : 0;

  // Multi-pin connector options
  const connectorOptions = Array.isArray(product.connectorTypes) && product.connectorTypes.length > 0
    ? product.connectorTypes
    : [];

  const handleAddToCartClick = () => {
    const itemToAdd = {
      ...product,
      selectedColor,
      selectedConnector,
    };
    onAddToCart(itemToAdd, qty);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  const handleBuyNowClick = () => {
    const itemToAdd = {
      ...product,
      selectedColor,
      selectedConnector,
    };
    onBuyNow(itemToAdd, qty);
  };

  const whatsappInquiryUrl = `https://wa.me/923269589597?text=${encodeURIComponent(
    `Assalam-o-Alaikum CellFocus, I want to inquire about: ${product.name} (Code: CF-${product.id || product._id}). Price: Rs. ${priceNum}.`
  )}`;

  const wholesaleInquiryUrl = `https://wa.me/923269589597?text=${encodeURIComponent(
    `Assalam-o-Alaikum CellFocus, I am looking for wholesale rates / bulk quantity of: ${product.name} (Code: CF-${product.id || product._id}).`
  )}`;

  // Related products
  const relatedProducts = products
    .filter((p) => (p.id || p._id) !== (product.id || product._id))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1c1b18] flex flex-col font-sans selection:bg-[#e5e0d4] relative">
      <SEOHead product={product} />

      <Navbar
        cartCount={cartCount}
        onCategoryClick={() => {}}
        onOpenCart={onOpenCart}
        onOpenAdmin={onOpenAdmin}
        onOpenTracking={onOpenTracking}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center flex-wrap gap-2 text-xs text-[#78746a]">
          <Link to="/" className="hover:text-[#1c1b18] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#a8a497]" />
          <Link to={`/category/${categorySlug}`} className="hover:text-[#1c1b18] transition-colors">
            {categoryConfig.name}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#a8a497]" />
          <span className="text-[#1c1b18] font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Main Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          {/* Left Column: Image Gallery (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-square bg-white rounded-3xl border border-[#e5e2d6] overflow-hidden p-6 flex items-center justify-center shadow-sm relative">
              {hasDiscount && (
                <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-xs shadow-md">
                  {discountPercent}% OFF
                </div>
              )}
              <img
                src={gallery[activeImageIndex] || gallery[0]}
                alt={`${product.name} - Angle ${activeImageIndex + 1}`}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                fetchpriority="high"
              />
            </div>

            {/* Thumbnail Switcher */}
            {gallery.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl border-2 overflow-hidden bg-white shrink-0 p-1 transition-all ${
                      activeImageIndex === idx ? 'border-[#1c1b18] scale-105 shadow-sm' : 'border-[#e5e2d6] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Buying Options & Details (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 rounded-full bg-[#eeebe2] text-[#4a473f] text-xs font-semibold uppercase tracking-wider mb-2">
                {categoryConfig.name}
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1c1b18] tracking-tight leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Pricing Section */}
            <div className="flex items-baseline gap-3 mb-6 p-4 rounded-2xl bg-white border border-[#e5e2d6] shadow-2xs">
              <span className="text-3xl font-extrabold text-[#1c1b18]">
                {formatPrice(priceNum)}
              </span>
              {hasDiscount && (
                <span className="text-base text-[#78746a] line-through font-medium">
                  {formatPrice(originalPriceNum)}
                </span>
              )}
              <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                In Stock & Ready to Dispatch
              </span>
            </div>

            {/* Subtitle / Key Hook */}
            {product.details && (
              <p className="text-sm text-[#4a473f] mb-6 leading-relaxed">
                {product.details}
              </p>
            )}

            {/* Connector Type Selector */}
            {connectorOptions.length > 0 && (
              <div className="mb-6">
                <span className="block text-xs font-bold text-[#1c1b18] uppercase tracking-wider mb-2">
                  Select Connector / Pin:
                </span>
                <div className="flex flex-wrap gap-2">
                  {connectorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedConnector(c)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedConnector === c
                          ? 'bg-[#1c1b18] text-[#f7f4ec] border-[#1c1b18] shadow-sm'
                          : 'bg-white text-[#4a473f] border-[#e5e2d6] hover:border-[#1c1b18]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Options */}
            {Array.isArray(product.colors) && product.colors.length > 0 && (
              <div className="mb-6">
                <span className="block text-xs font-bold text-[#1c1b18] uppercase tracking-wider mb-2">
                  Available Color: <span className="text-[#78746a] normal-case">{selectedColor || 'Default'}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((col, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColor(col.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selectedColor === col.name
                          ? 'bg-[#1c1b18] text-white border-[#1c1b18]'
                          : 'bg-white text-[#4a473f] border-[#e5e2d6] hover:border-[#1c1b18]'
                      }`}
                    >
                      {col.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#1c1b18] uppercase tracking-wider">Quantity:</span>
                <div className="flex items-center border border-[#e5e2d6] rounded-xl bg-white overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-3.5 py-1.5 text-sm font-bold text-[#4a473f] hover:bg-[#eeebe2] transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-extrabold text-[#1c1b18] min-w-8 text-center">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(qty + 1)}
                    className="px-3.5 py-1.5 text-sm font-bold text-[#4a473f] hover:bg-[#eeebe2] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBuyNowClick}
                  className="w-full py-4 px-6 rounded-2xl bg-[#1c1b18] hover:bg-black text-[#f7f4ec] font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[#00ffff]" />
                  Buy Now (Cash on Delivery)
                </button>

                <button
                  type="button"
                  onClick={handleAddToCartClick}
                  className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-[#faf8f4] text-[#1c1b18] font-bold text-sm border-2 border-[#1c1b18] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  {addedNotice ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>

              {/* Direct WhatsApp Ordering */}
              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-200 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Order Directly on WhatsApp (+92 326 9589597)
              </a>
            </div>

            {/* Wholesale Callout Box for Retailers */}
            <div className="p-4 rounded-2xl bg-[#faf8f4] border border-[#e5e2d6] flex items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1c1b18]">
                  <Building2 className="w-3.5 h-3.5 text-[#00a3a3]" />
                  Buying in Wholesale or Bulk?
                </span>
                <p className="text-[11px] text-[#78746a] mt-0.5">
                  Get special carton rates and MOQ discounts for mobile shops across Pakistan.
                </p>
              </div>
              <a
                href={wholesaleInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#1c1b18] text-[#f7f4ec] text-xs font-bold shrink-0 hover:bg-black transition-colors"
              >
                Wholesale Quote
              </a>
            </div>

            {/* Guarantees & Features */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-[#e5e2d6] text-center">
              <div className="space-y-1">
                <Truck className="w-5 h-5 mx-auto text-[#00a3a3]" />
                <span className="block text-[11px] font-bold text-[#1c1b18]">Nationwide COD</span>
                <span className="block text-[10px] text-[#78746a]">24-48h Delivery</span>
              </div>
              <div className="space-y-1">
                <ShieldCheck className="w-5 h-5 mx-auto text-emerald-600" />
                <span className="block text-[11px] font-bold text-[#1c1b18]">Checking Warranty</span>
                <span className="block text-[10px] text-[#78746a]">7-Day Replacement</span>
              </div>
              <div className="space-y-1">
                <RotateCcw className="w-5 h-5 mx-auto text-amber-600" />
                <span className="block text-[11px] font-bold text-[#1c1b18]">100% Tested</span>
                <span className="block text-[10px] text-[#78746a]">Pre-Dispatch QC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications & Detailed Overview */}
        {product.specs && (
          <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#e5e2d6] mb-16 shadow-2xs">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1c1b18] mb-6">
              Product Specifications & Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.specs.split('\n').filter(Boolean).map((specLine, sIdx) => {
                const colonIdx = specLine.indexOf(':');
                const label = colonIdx > -1 ? specLine.slice(0, colonIdx).trim() : 'Feature';
                const val = colonIdx > -1 ? specLine.slice(colonIdx + 1).trim() : specLine.trim();
                return (
                  <div key={sIdx} className="flex items-start justify-between p-3 rounded-xl bg-[#faf8f4] border border-[#eeebe2]">
                    <span className="text-xs font-semibold text-[#78746a]">{label}</span>
                    <span className="text-xs font-bold text-[#1c1b18] text-right">{val}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1c1b18]">
                Related Mobile Accessories
              </h2>
              <Link to={`/category/${categorySlug}`} className="text-xs font-bold text-[#1c1b18] hover:underline flex items-center gap-1">
                View All {categoryConfig.name} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => {
                const relPid = rel.id || rel._id;
                const relSlug = slugify(rel.name);
                const relImg = rel.image || (Array.isArray(rel.images) && rel.images[0]) || '';
                return (
                  <Link
                    key={relPid}
                    to={`/product/${relSlug}-${relPid}`}
                    className="group bg-white rounded-2xl p-4 border border-[#e5e2d6] hover:border-[#1c1b18] transition-all flex flex-col"
                  >
                    <div className="aspect-square bg-[#faf8f4] rounded-xl overflow-hidden mb-3 p-2 flex items-center justify-center">
                      <img
                        src={relImg}
                        alt={rel.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-xs font-bold text-[#1c1b18] line-clamp-2 mb-1 group-hover:text-[#00a3a3] transition-colors">
                      {rel.name}
                    </h3>
                    <span className="mt-auto text-xs font-extrabold text-[#1c1b18]">
                      {formatPrice(rel.price)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer onCategoryClick={() => {}} onOpenAdmin={onOpenAdmin} />
      <WhatsAppButton />
    </div>
  );
}

