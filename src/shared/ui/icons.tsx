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

export const HandIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11M12 10V4.5a1.5 1.5 0 0 1 3 0V11M15 10.5V6.5a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6.5 7-3 0-4.5-1.5-6-4l-2-3.5a1.5 1.5 0 0 1 2.6-1.5L9 13.5V8.5a1.5 1.5 0 0 0-3 0" />
  </svg>
)

export const StarIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" />
  </svg>
)

/** Bingkai pindai + QR, sesuai tombol QR di desain HUD. */
export const ScanQrIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
    <path
      d="M7 7h4v4H7zM13 7h4v4h-4zM7 13h4v4H7zM13 13h1.5v1.5H13zM15.5 15.5H17V17h-1.5z"
      strokeWidth={1.8}
    />
  </svg>
)

/** Empat panah ke tengah: "lihat seluruh peta" (zoom out penuh). */
export const ShrinkIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 4l5 5M9 4.5V9H4.5M20 4l-5 5M15 4.5V9h4.5M4 20l5-5M4.5 15H9v4.5M20 20l-5-5M19.5 15H15v4.5" />
  </svg>
)

export const InfoIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 11v6M12 7.5v.01" />
  </svg>
)
