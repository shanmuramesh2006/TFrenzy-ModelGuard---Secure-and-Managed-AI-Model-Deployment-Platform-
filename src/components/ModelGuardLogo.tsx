import React from 'react';

export const ModelGuardLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shield background */}
    <path 
      d="M20 3L8 8v9c0 8 12 16 12 16s12-8 12-16V8L20 3Z" 
      fill="url(#logoGradient)" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    
    {/* AI/Tech symbol inside */}
    <circle cx="20" cy="18" r="6" fill="white" opacity="0.9"/>
    <path 
      d="M16 18h8M20 14v8" 
      stroke="url(#logoGradient)" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    
    {/* Gradient definition */}
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB"/>
        <stop offset="100%" stopColor="#00F0FF"/>
      </linearGradient>
    </defs>
  </svg>
);
