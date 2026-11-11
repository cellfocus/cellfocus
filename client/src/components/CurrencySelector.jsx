import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import CountryFlag from './CountryFlag';

export default function CurrencySelector({ className = '', compact = false }) {
  const { currency, currentCurrency, currencies, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currencyList = Object.values(currencies);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#dedad0] bg-white/80 hover:bg-white text-xs font-semibold text-[#1c1b18] transition-all shadow-2xs cursor-pointer select-none"
        aria-label="Select store currency"
        aria-expanded={isOpen}
      >
        <CountryFlag code={currentCurrency.code} className="w-4 h-3 rounded-[2px]" />
        <span className="tracking-wide font-mono text-[11px] font-bold text-[#1c1b18]">
          {currentCurrency.code}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#78746a] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white/95 backdrop-blur-md border border-[#e5e1d5] shadow-xl py-1 z-50 animate-fadeIn">
          <div className="px-3 py-1.5 border-b border-[#f0ece2] mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8a867c] block">
              Display Currency
            </span>
            <span className="text-[9px] text-[#0d9488] font-medium flex items-center gap-1 mt-0.5">
              <span>Base:</span>
              <CountryFlag code="PKR" className="w-3.5 h-2.5 rounded-[1px]" />
              <span>PKR (Pakistani Rupee)</span>
            </span>
          </div>

          <div className="space-y-0.5 px-1">
            {currencyList.map((c) => {
              const isSelected = c.code === currency;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCurrency(c.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1c1b18] text-white font-semibold'
                      : 'hover:bg-[#f5f2e9] text-[#1c1b18]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CountryFlag code={c.code} className="w-5 h-3.5 rounded-[2px]" />
                    <div className="text-left">
                      <span className="font-bold tracking-wide">{c.code}</span>
                      {!compact && (
                        <span
                          className={`text-[10px] block leading-tight ${
                            isSelected ? 'text-stone-300' : 'text-[#78746a]'
                          }`}
                        >
                          {c.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

