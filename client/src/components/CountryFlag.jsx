import React from 'react';
import pkFlag from '../assets/flags/pk.svg';
import usFlag from '../assets/flags/us.svg';
import aeFlag from '../assets/flags/ae.svg';
import saFlag from '../assets/flags/sa.svg';

export const FLAG_MAP = {
  PKR: { src: pkFlag, alt: 'Pakistan Flag', label: 'Pakistan' },
  PK: { src: pkFlag, alt: 'Pakistan Flag', label: 'Pakistan' },
  USD: { src: usFlag, alt: 'United States Flag', label: 'United States' },
  US: { src: usFlag, alt: 'United States Flag', label: 'United States' },
  AED: { src: aeFlag, alt: 'United Arab Emirates Flag', label: 'United Arab Emirates' },
  AE: { src: aeFlag, alt: 'United Arab Emirates Flag', label: 'United Arab Emirates' },
  SAR: { src: saFlag, alt: 'Saudi Arabia Flag', label: 'Saudi Arabia' },
  SA: { src: saFlag, alt: 'Saudi Arabia Flag', label: 'Saudi Arabia' },
};

export default function CountryFlag({ 
  code = 'PKR', 
  className = 'w-5 h-3.5', 
  rounded = 'rounded-xs' 
}) {
  const item = FLAG_MAP[code?.toUpperCase()] || FLAG_MAP.PKR;
  return (
    <img
      src={item.src}
      alt={item.alt}
      title={item.label}
      className={`${className} ${rounded} object-cover border border-black/15 shadow-2xs shrink-0 inline-block align-middle`}
      loading="eager"
    />
  );
}

