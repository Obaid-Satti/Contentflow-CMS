import type { SVGProps } from 'react';

interface ContentFlowLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  withShadow?: boolean;
}

export function ContentFlowLogo({
  size = 36,
  className = '',
  withShadow = false,
  style,
  ...props
}: ContentFlowLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      style={{
        ...(withShadow
          ? {
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.45)',
              borderRadius: `${Math.round((size / 40) * 10)}px`,
            }
          : {}),
        ...style,
      }}
      {...props}
    >
      <defs>
        <linearGradient id="cf-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Rounded background squircle */}
      <rect width="40" height="40" rx="10" fill="url(#cf-logo-gradient)" />

      {/* Content layers */}
      <rect x="5" y="7" width="30" height="5" rx="2.5" fill="white" opacity="0.95" />
      <rect x="5" y="16" width="20" height="5" rx="2.5" fill="white" opacity="0.7" />
      <rect x="5" y="25" width="25" height="5" rx="2.5" fill="white" opacity="0.45" />

      {/* Published checkmark badge */}
      <circle cx="33" cy="31" r="6" fill="#c4b5fd" stroke="white" strokeWidth="1.5" />
      <path
        d="M30.5 31l1.8 1.8 3.2-3.2"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default ContentFlowLogo;
