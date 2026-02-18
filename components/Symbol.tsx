import React from 'react';

export const Symbol: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer Ring */}
    <circle cx="50" cy="50" r="50" className="fill-sumi" />
    
    {/* Cuts (using background color to simulate negative space) */}
    {/* Vertical Top */}
    <path d="M50 0 L50 25" stroke="#F4F4F4" strokeWidth="1.5" />
    
    {/* Horizontal Left */}
    <path d="M0 50 L25 50" stroke="#F4F4F4" strokeWidth="1.5" />
    
    {/* Horizontal Right */}
    <path d="M75 50 L100 50" stroke="#F4F4F4" strokeWidth="1.5" />
    
    {/* Vertical Bottom (Double Line) */}
    <path d="M48 75 L48 100" stroke="#F4F4F4" strokeWidth="1" />
    <path d="M52 75 L52 100" stroke="#F4F4F4" strokeWidth="1" />
    
    {/* Diagonal Top-Left */}
    {/* Center 50,50. 135deg (Top Left). Start ~15,15 End ~32,32 */}
    <path d="M14.6 14.6 L32.3 32.3" stroke="#F4F4F4" strokeWidth="1.5" />

    {/* Inner Circle */}
    <circle cx="50" cy="50" r="25" className="fill-stone" />
  </svg>
);