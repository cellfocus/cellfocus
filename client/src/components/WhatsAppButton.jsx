import React, { useState } from 'react';

export default function WhatsAppButton() {
  const [isHovered, setIsHovered] = useState(false);
  const phoneNumber = '923269589597';
  const defaultMessage = encodeURIComponent('Hi CellFocus, I have an inquiry about your accessories!');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  return (
    <aside aria-label="WhatsApp Quick Contact">
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5">
        {/* Subtle Tooltip Label on Desktop Hover */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1c1b18]/90 text-white text-xs font-medium shadow-md backdrop-blur-md transition-all duration-200 pointer-events-none select-none ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
          <span>Chat on WhatsApp</span>
        </div>

        {/* WhatsApp Floating Action Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Chat with CellFocus on WhatsApp (+92 326 9589597)"
          title="Chat with CellFocus on WhatsApp"
          className="group relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 hover:scale-108 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          {/* Subtle Ambient Pulse Ring */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366]/25 animate-ping opacity-60 pointer-events-none" />

          {/* WhatsApp Vector Icon */}
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 fill-white relative z-10 transition-transform duration-200 group-hover:rotate-6"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M16 2C8.28 2 2 8.28 2 16c0 2.72.78 5.26 2.13 7.42L2.5 30l6.76-1.61C11.3 29.47 13.58 30 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5c-2.14 0-4.14-.56-5.88-1.54l-.42-.24-4.37 1.04 1.07-4.25-.26-.44C5.07 20.3 4.5 18.22 4.5 16 4.5 9.66 9.66 4.5 16 4.5 22.34 4.5 27.5 9.66 27.5 16S22.34 27.5 16 27.5zm7.38-8.52c-.4-.2-2.38-1.18-2.75-1.31-.37-.14-.64-.2-.91.2-.27.4-1.04 1.31-1.28 1.58-.24.27-.47.3-.87.1-.4-.2-1.69-.62-3.22-1.99-1.19-1.06-1.99-2.37-2.22-2.77-.24-.4-.03-.62.17-.82.18-.18.4-.47.6-.7.2-.24.27-.4.4-.67.14-.27.07-.5-.03-.7-.1-.2-.91-2.19-1.25-3-.33-.79-.67-.68-.91-.7-.24-.01-.51-.01-.78-.01-.27 0-.7.1-1.07.5-.37.4-1.41 1.38-1.41 3.36 0 1.98 1.44 3.9 1.64 4.17.2.27 2.84 4.34 6.88 6.08.96.41 1.71.66 2.3.85.97.31 1.85.27 2.55.16.78-.12 2.38-.97 2.72-1.91.34-.94.34-1.74.24-1.91-.1-.17-.37-.27-.77-.47z" />
          </svg>
        </a>
      </div>
    </aside>
  );
}

