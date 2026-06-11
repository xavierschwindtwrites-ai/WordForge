import React from 'react';

// The Inkwell mark: a drop of ink catching a spark of inspiration. Drawn
// inline so it inherits the amber accent and needs no bundled asset.
const Logo: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* ink drop */}
    <path
      d="M14.5 4C14.5 4 6.5 13.8 6.5 19.6a8 8 0 0 0 16 0C22.5 13.8 14.5 4 14.5 4Z"
      fill="currentColor"
      opacity="0.95"
    />
    {/* sheen on the bulb */}
    <path
      d="M10.4 19.2c0-2 1.2-4.6 2.4-6.6"
      stroke="#0f0f0f"
      strokeWidth="1.7"
      strokeLinecap="round"
      opacity="0.55"
    />
    {/* spark */}
    <path
      d="M25.5 4.5l1 2.7 2.7 1-2.7 1-1 2.7-1-2.7-2.7-1 2.7-1 1-2.7Z"
      fill="currentColor"
    />
    {/* small companion sparkle */}
    <circle cx="27.6" cy="14.8" r="1.15" fill="currentColor" opacity="0.85" />
  </svg>
);

export default Logo;
