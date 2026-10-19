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

/* ---------- Ikon kartu hewan (garis coklat seperti desain) ---------- */

export const CrownIcon = (props: IconProps) => (
  <svg {...base} strokeWidth={2} {...props}>
    <path d="M4 18h16M5 15.5L3.5 7l5 4L12 4.5 15.5 11l5-4L19 15.5z" />
  </svg>
)

export const FoldedMapIcon = (props: IconProps) => (
  <svg {...base} strokeWidth={2} {...props}>
    <path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5zM9 4v13.5M15 6.5V20" />
  </svg>
)

export const FoodIcon = (props: IconProps) => (
  <svg {...base} strokeWidth={2} {...props}>
    <path d="M3.5 10.5L12 3.5l8.5 7V20h-17z" />
    <path d="M9 12v2.5a1.5 1.5 0 0 0 3 0V12M10.5 12v7M15 12c-1 1-1 3.5 0 4.5V19" />
  </svg>
)

export const MoodIcon = (props: IconProps) => (
  <svg {...base} strokeWidth={2} {...props}>
    <path d="M20.6 10.5A9 9 0 1 1 13.5 3.1" />
    <path d="M8.5 9.5v.5M13 9.5v.5M8 14c1.6 2 5.4 2 7 0" />
    <path
      d="M19 2.6c.9-.9 2.5-.3 2.5 1 0 1.4-2.5 3-2.5 3s-2.5-1.6-2.5-3c0-1.3 1.6-1.9 2.5-1z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
)

/** Filum: sel heksagonal. */
export const PhylumIcon = (props: IconProps) => (
  <svg {...base} strokeWidth={2} {...props}>
    <path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z" />
    <circle cx="12" cy="12" r="3.2" />
  </svg>
)

/** Kelas: bintang. */
export const ClassIcon = (props: IconProps) => (
  <svg {...base} strokeWidth={2} {...props}>
    <path d="M10 4l2.1 4.4 4.8.6-3.5 3.3.9 4.8L10 14.8l-4.3 2.3.9-4.8L3.1 9l4.8-.6z" />
    <path d="M19 15l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" />
  </svg>
)

/** Ordo: percabangan. */
export const OrderIcon = (props: IconProps) => (
  <svg {...base} strokeWidth={2} {...props}>
    <rect x="3" y="3" width="5" height="5" rx="1" />
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="M5.5 8v4.5c0 1.4 1.1 2.5 2.5 2.5h7.5M8 5.5h7.5" />
  </svg>
)

/** Famili: keluarga. */
export const FamilyIcon = (props: IconProps) => (
  <svg {...base} fill="currentColor" stroke="none" {...props}>
    <circle cx="6.5" cy="4.5" r="2.2" />
    <circle cx="17.5" cy="4.5" r="2.2" />
    <circle cx="12" cy="11" r="1.7" />
    <path d="M4 8h5v7H8v6H5v-6H4zM15 8h5l1.5 7H19v6h-3v-6h-2.5zM10 13.5h4v3.5h-.8v4h-2.4v-4H10z" />
  </svg>
)

/** Genus: dokumen dengan kaca pembesar. */
export const GenusIcon = (props: IconProps) => (
  <svg {...base} strokeWidth={2} {...props}>
    <path d="M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v4" />
    <circle cx="15.5" cy="15.5" r="3" />
    <path d="M17.7 17.7l2.8 2.8" />
  </svg>
)

/** Spesies: satu individu. */
export const SpeciesIcon = (props: IconProps) => (
  <svg {...base} fill="currentColor" stroke="none" {...props}>
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5z" />
  </svg>
)

export const SpeakerIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
)

export const ChevronsDownIcon = (props: IconProps) => (
  <svg {...base} strokeWidth={2} {...props}>
    <path d="M6 6.5l6 5 6-5M6 12.5l6 5 6-5" />
  </svg>
)

/** Kamera dengan sinyal: penanda area kamera scanner sebelum gambar kamera tampil. */
export const CameraSignalIcon = (props: IconProps) => (
  <svg {...base} strokeWidth={2} {...props}>
    <path d="M3 9.5a2 2 0 0 1 2-2h2.5L9 5.5h4" />
    <path d="M3 9.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
    <circle cx="11" cy="14" r="3.2" />
    <path d="M16 3.5a4.5 4.5 0 0 1 4.5 4.5M16 6.5A1.5 1.5 0 0 1 17.5 8" />
  </svg>
)
