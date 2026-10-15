import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export const CloseIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const CameraIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
)

export const QrIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" />
  </svg>
)

export const PawIcon = (props: IconProps) => (
  <svg {...base} fill="currentColor" stroke="none" {...props}>
    <ellipse cx="12" cy="15.5" rx="4.6" ry="3.9" />
    <ellipse cx="6.2" cy="10.6" rx="1.9" ry="2.4" />
    <ellipse cx="17.8" cy="10.6" rx="1.9" ry="2.4" />
    <ellipse cx="9.4" cy="6.8" rx="1.8" ry="2.3" />
    <ellipse cx="14.6" cy="6.8" rx="1.8" ry="2.3" />
  </svg>
)

export const MapIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
)

export const FlashIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M13 3L5 14h6l-1 7 8-11h-6z" />
  </svg>
)

export const KeyboardIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
  </svg>
)

export const PhoneRotateIcon = (props: IconProps) => (
  <svg {...base} viewBox="0 0 48 48" strokeWidth={3} {...props}>
    <rect x="15" y="6" width="18" height="36" rx="4" />
    <path d="M22 37h4" />
  </svg>
)
