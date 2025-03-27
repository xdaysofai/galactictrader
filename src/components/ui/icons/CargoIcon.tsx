import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

export default function CargoIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
      <path d="M7 7h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 15h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
    </svg>
  );
} 