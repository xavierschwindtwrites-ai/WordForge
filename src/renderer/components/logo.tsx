import React from 'react';

// Quill-and-spark motif rendered inline so it inherits the amber accent and
// needs no bundled asset.
const Logo: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* quill nib */}
    <path
      d="M25 6C18 9 12 15 9 22l-2 4 4-2c7-3 13-9 16-16l-2 0Z"
      fill="currentColor"
      opacity="0.92"
    />
    <path d="M9 22l4 4" stroke="#0f0f0f" strokeWidth="1.4" strokeLinecap="round" />
    {/* spark */}
    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M24 22v5" />
      <path d="M21.5 24.5h5" />
    </g>
    <circle cx="24" cy="24.5" r="1.3" fill="currentColor" />
  </svg>
);

export default Logo;
