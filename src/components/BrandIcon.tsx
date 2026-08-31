import React from 'react';

interface BrandIconProps {
  className?: string;
  size?: number;
}

export const BrandIcon: React.FC<BrandIconProps> = ({ className = '', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`rounded-full shrink-0 shadow-md ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E1D9" />
          <stop offset="45%" stopColor="#3AAFA9" />
          <stop offset="75%" stopColor="#A27B8C" />
          <stop offset="100%" stopColor="#FF6B6B" />
        </linearGradient>
        <radialGradient id="glossEffect" cx="40%" cy="25%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer circular badge */}
      <circle cx="100" cy="100" r="98" fill="url(#brandGradient)" stroke="#ffffff" strokeWidth="3" />
      <circle cx="100" cy="100" r="98" fill="url(#glossEffect)" />

      {/* Stylized pathway loop at the bottom */}
      <path
        d="M 68 135 C 62 120 75 108 95 110 C 112 112 135 110 142 125 C 147 136 135 146 100 146 C 75 146 64 140 68 135 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="11"
        strokeLinecap="round"
      />

      {/* City skyline silhouette on the left */}
      <rect x="62" y="102" width="10" height="20" rx="1.5" fill="#ffffff" transform="rotate(-15 62 102)" />
      <rect x="73" y="90" width="12" height="30" rx="2" fill="#ffffff" transform="rotate(-10 73 90)" />

      {/* Cutlery & Palm Tree silhouettes on the right */}
      {/* Fork & Knife */}
      <path
        d="M 122 105 L 122 120 M 120 102 L 120 108 M 124 102 L 124 108 M 128 102 L 128 120 M 128 102 C 130 102 131 106 128 109"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Palm tree */}
      <path
        d="M 143 120 Q 140 106 137 98 M 137 98 Q 128 94 125 99 M 137 98 Q 134 88 140 88 M 137 98 Q 147 92 148 98"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Central big Location Pin */}
      <path
        d="M 100 56 C 81 56 66 71 66 90 C 66 112 95 135 100 140 C 105 135 134 112 134 90 C 134 71 119 56 100 56 Z"
        fill="#ffffff"
      />

      {/* Heart inside the pin */}
      <path
        d="M 100 95 C 100 95 86 86 86 78 C 86 72 90 68 95 68 C 98 68 100 70 100 72 C 100 70 102 68 105 68 C 110 68 114 72 114 78 C 114 86 100 95 100 95 Z"
        fill="#4ECDC4"
      />

      {/* Small marker at the bottom curve */}
      <path
        d="M 100 142 C 96 142 93 145 93 149 C 93 154 100 162 100 162 C 100 162 107 154 107 149 C 107 145 104 142 100 142 Z"
        fill="#ffffff"
      />
      <circle cx="100" cy="148" r="2.2" fill="#FF6B6B" />
    </svg>
  );
};
