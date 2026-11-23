import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Package, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare, 
  ArrowRight, 
  ChevronRight,
  Zap,
  Headphones,
  Watch,
  PhoneCall
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import WhatsAppButton from '../components/WhatsAppButton';

export default function WholesalePage({ onOpenCart, onOpenAdmin, onOpenTracking, cartCount = 0 }) {
  const WHATSAPP_NUMBER = '923269589597';
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Assalam-o-Alaikum CellFocus Team, I am interested in wholesale / bulk purchasing of mobile accessories. Please send me your wholesale catalog and price list.'
  )}`;

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1c1b18] flex flex-col font-sans selection:bg-[#e5e0d4] relative">
      <SEOHead pagePath="/wholesale" />

      {/* Navigation */}
      <Navbar
        cartCount={cartCount}
        onCategoryClick={() => {}}
        onOpenCart={onOpenCart}
        onOpenAdmin={onOpenAdmin}
        onOpenTracking={onOpenTracking}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-[#78746a]">
          <Link to="/" className="hover:text-[#1c1b18] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#a8a497]" />
          <span className="text-[#1c1b18] font-medium">Wholesale Mobile Accessories</span>
        </nav>

        {/* Hero Section */}
        <section className="bg-[#1c1b18] text-[#f7f4ec] rounded-3xl p-6 sm:p-12 lg:p-16 mb-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#00ffff]/20 via-[#00ffff]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#00ffff] text-xs font-semibold mb-4 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              Direct Importer & Factory Wholesale Supplier
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              Mobile Accessories Wholesale in Pakistan
            </h1>
            
            <p className="text-base sm:text-lg text-[#d5d1c5] mb-8 leading-relaxed">
              Partner directly with CellFocus for bulk supply of original fast chargers, wireless earpods, 
              calling smartwatches, and high-speed data cables. Supplying mobile shop owners, phone retailers, 
              and wholesalers in Lahore (Hall Road, Hafeez Centre), Karachi (Shah Alam, Saddar), Rawalpindi, and across Pakistan.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#00ffff] text-[#1c1b18] font-bold hover:bg-[#00e6e6] transition-all shadow-lg hover:scale-102"
              >
                <MessageSquare className="w-5 h-5" />
                Get Wholesale Price List on WhatsApp
              </a>
              <a
                href="tel:+923269589597"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-[#f7f4ec] font-semibold transition-all border border-white/20"
              >
                <PhoneCall className="w-4 h-4 text-[#00ffff]" />
                Call: +92 326 9589597
              </a>
            </div>
          </div>
        </section>

        {/* Wholesale Tiers & MOQ */}
        <section className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1c1b18] mb-3">
              Flexible Wholesale Tiers & Minimum Order Quantities (MOQ)
            </h2>
            <p className="text-sm sm:text-base text-[#5c584e]">
              Start small to test market demand or purchase master cartons for maximum profit margins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5e2d6] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#eeebe2] flex items-center justify-center text-[#1c1b18] font-bold mb-4">
                <Package className="w-6 h-6 text-[#1c1b18]" />
              </div>
              <h3 className="text-xl font-bold text-[#1c1b18] mb-2">Retailer Starter Pack</h3>
              <p className="text-xs text-[#78746a] mb-4">Ideal for new shop owners & test batches</p>
              <div className="text-2xl font-extrabold text-[#1c1b18] mb-4">
                MOQ: 10 Pcs <span className="text-xs font-normal text-[#78746a]">/ Mix & Match</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#4a473f] mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Access to wholesale tier pricing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Full 7-day checking warranty
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Cash on Delivery available nationwide
                </li>
              </ul>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#eeebe2] hover:bg-[#e5e2d6] text-[#1c1b18] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                Inquire Starter Rates <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Tier 2 (Highlighted) */}
            <div className="bg-[#1c1b18] text-[#f7f4ec] rounded-2xl p-6 sm:p-8 border-2 border-[#00ffff] shadow-lg relative">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-[#00ffff] text-[#1c1b18] text-[11px] font-extrabold uppercase tracking-wide">
                Most Popular for Shops
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#00ffff] font-bold mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#f7f4ec] mb-2">Shopkeeper Master Carton</h3>
              <p className="text-xs text-[#a8a497] mb-4">Best seller for active retail outlets</p>
              <div className="text-2xl font-extrabold text-[#00ffff] mb-4">
                MOQ: 50 Pcs <span className="text-xs font-normal text-[#a8a497]">/ Assorted</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#d5d1c5] mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00ffff] shrink-0" />
                  Deep bulk discount (up to 35% margin)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00ffff] shrink-0" />
                  Free Daewoo/TCS cargo shipping
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00ffff] shrink-0" />
                  Priority 24-hour order dispatch
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00ffff] shrink-0" />
                  Dedicated WhatsApp account manager
                </li>
              </ul>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#00ffff] hover:bg-[#00e6e6] text-[#1c1b18] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
              >
                Inquire Master Carton Rates <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Tier 3 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5e2d6] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#eeebe2] flex items-center justify-center text-[#1c1b18] font-bold mb-4">
                <Building2 className="w-6 h-6 text-[#1c1b18]" />
              </div>
              <h3 className="text-xl font-bold text-[#1c1b18] mb-2">Distributor & Whole Carton</h3>
              <p className="text-xs text-[#78746a] mb-4">For city distributors & regional wholesalers</p>
              <div className="text-2xl font-extrabold text-[#1c1b18] mb-4">
                MOQ: 100+ Pcs
              </div>
              <ul className="space-y-2.5 text-xs text-[#4a473f] mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Lowest factory-gate wholesale rates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Direct cargo dispatch to any city
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Customized product sourcing on demand
                </li>
              </ul>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#eeebe2] hover:bg-[#e5e2d6] text-[#1c1b18] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                Inquire Distributor Rates <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* Why Wholesale With CellFocus */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 border border-[#e5e2d6] mb-16">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1c1b18] mb-3">
              Why 500+ Mobile Retailers in Pakistan Source from CellFocus
            </h2>
            <p className="text-sm text-[#5c584e] leading-relaxed">
              We eliminate intermediaries so you receive direct importer rates with verified quality control. 
              No duplicate pieces, no broken pins, and guaranteed functional testing before parcel sealing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 rounded-2xl bg-[#faf8f4] border border-[#eeebe2]">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mb-3" />
              <h3 className="font-bold text-[#1c1b18] text-sm mb-1">100% Quality Checked</h3>
              <p className="text-xs text-[#78746a]">Every charger, pin, and earbud is tested for wattage and battery performance before dispatch.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#faf8f4] border border-[#eeebe2]">
              <Truck className="w-8 h-8 text-[#00a3a3] mb-3" />
              <h3 className="font-bold text-[#1c1b18] text-sm mb-1">Nationwide COD Cargo</h3>
              <p className="text-xs text-[#78746a]">Fast 24-48 hour delivery via Leopard, Daewoo Cargo, and TCS to all commercial markets across Pakistan.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#faf8f4] border border-[#eeebe2]">
              <Package className="w-8 h-8 text-amber-600 mb-3" />
              <h3 className="font-bold text-[#1c1b18] text-sm mb-1">Ready Stock Availability</h3>
              <p className="text-xs text-[#78746a]">All listed products are stocked locally in our warehouse for instant dispatch without preorder delays.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#faf8f4] border border-[#eeebe2]">
              <MessageSquare className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-[#1c1b18] text-sm mb-1">Instant WhatsApp Support</h3>
              <p className="text-xs text-[#78746a]">Direct communication with wholesale managers for order updates, tracking, and warranty claims.</p>
            </div>
          </div>
        </section>

        {/* Wholesale Product Categories */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1c1b18] mb-6">
            Explore Wholesale Product Lines
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link
              to="/category/chargers"
              className="group p-6 rounded-2xl bg-white border border-[#e5e2d6] hover:border-[#1c1b18] transition-all"
            >
              <Zap className="w-8 h-8 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-lg text-[#1c1b18] mb-1">Fast Chargers & Adapters</h3>
              <p className="text-xs text-[#78746a] mb-4">65W GaN dual-port chargers, Type-C, USB-Micro & multi-pin adapters.</p>
              <span className="text-xs font-bold text-[#1c1b18] flex items-center gap-1 group-hover:gap-2 transition-all">
                Browse Chargers <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/category/airpods"
              className="group p-6 rounded-2xl bg-white border border-[#e5e2d6] hover:border-[#1c1b18] transition-all"
            >
              <Headphones className="w-8 h-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-lg text-[#1c1b18] mb-1">Wireless Earpods & AirPods</h3>
              <p className="text-xs text-[#78746a] mb-4">ANC noise cancelling earbuds, gaming low-latency earpods, deep bass.</p>
              <span className="text-xs font-bold text-[#1c1b18] flex items-center gap-1 group-hover:gap-2 transition-all">
                Browse Earpods <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/category/smartwatches"
              className="group p-6 rounded-2xl bg-white border border-[#e5e2d6] hover:border-[#1c1b18] transition-all"
            >
              <Watch className="w-8 h-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-lg text-[#1c1b18] mb-1">Smartwatches & Bands</h3>
              <p className="text-xs text-[#78746a] mb-4">Calling smartwatches, AMOLED displays, waterproof fitness trackers.</p>
              <span className="text-xs font-bold text-[#1c1b18] flex items-center gap-1 group-hover:gap-2 transition-all">
                Browse Smartwatches <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </section>

        {/* WhatsApp Call to Action Banner */}
        <section className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-8 sm:p-12 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">Ready to Place a Bulk Wholesale Order?</h2>
            <p className="text-sm text-emerald-100 max-w-xl">
              Message our wholesale desk directly on WhatsApp. We share live videos of products, wholesale rate sheets, and provide same-day cargo dispatch.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-4 rounded-2xl bg-white text-emerald-800 font-bold hover:bg-emerald-50 transition-all shadow-md shrink-0 flex items-center gap-2 text-sm"
          >
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Chat with Wholesale Desk
          </a>
        </section>
      </main>

      <Footer onCategoryClick={() => {}} onOpenAdmin={onOpenAdmin} />
      <WhatsAppButton />
    </div>
  );
}

