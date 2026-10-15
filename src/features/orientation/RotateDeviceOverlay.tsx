import { PhoneRotateIcon } from '../../shared/ui/icons.tsx'

/** Muncul hanya saat HP dipegang tegak (CSS media query, tanpa JavaScript). */
export function RotateDeviceOverlay() {
  return (
    <div
      className="safe-pad absolute inset-0 z-[60] hidden flex-col items-center justify-center gap-5 bg-grass text-center text-white portrait:flex"
      data-testid="rotate-overlay"
      role="alert"
    >
      <PhoneRotateIcon className="size-24 animate-tilt" />
      <div className="max-w-72">
        <p className="text-2xl font-bold">Miringkan HP-mu</p>
        <p className="mt-1 text-base text-white/90">
          Peta kebun binatang paling seru dimainkan dalam posisi landscape.
        </p>
      </div>
    </div>
  )
}
