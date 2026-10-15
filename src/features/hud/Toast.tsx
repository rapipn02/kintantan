import { useEffect } from 'react'
import { useGameStore } from '../../app/gameStore.ts'

const TOAST_MS = 3500

export function Toast() {
  const toast = useGameStore((state) => state.toast)
  const dismiss = useGameStore((state) => state.dismissToast)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => dismiss(toast.id), TOAST_MS)
    return () => window.clearTimeout(timer)
  }, [toast, dismiss])

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[55] flex justify-center pt-[max(env(safe-area-inset-top),12px)]"
      aria-live="polite"
    >
      {toast && (
        <p
          key={toast.id}
          className="animate-fade-in rounded-full bg-bark px-4 py-2 font-semibold text-white shadow-lg"
        >
          {toast.message}
        </p>
      )}
    </div>
  )
}
