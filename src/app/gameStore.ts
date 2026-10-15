import { create } from 'zustand'
import { findExhibitByToken } from '../features/exhibits/catalog.ts'
import { useDiscoveryStore } from '../features/discovery/discoveryStore.ts'
import { extractToken } from '../features/scanner/parseScanResult.ts'
import { vibrate } from '../shared/lib/haptics.ts'

/** new = baru ditemukan, again = scan ulang kandang yang sama, view = buka kartu dari panel. */
export type RevealKind = 'new' | 'again' | 'view'

export interface Reveal {
  exhibitId: string
  kind: RevealKind
  /** Hewan yang sedang dipilih saat scan, bila QR yang discan ternyata milik hewan lain. */
  expectedId?: string
}

export type ClaimResult = { ok: true; exhibitId: string; isNew: boolean } | { ok: false }

interface Toast {
  id: number
  message: string
}

interface GameState {
  phase: 'intro' | 'playing'
  selectedId: string | null
  /** Exhibit yang sedang discan (scanner terbuka) atau null. */
  scanningFor: string | null
  reveal: Reveal | null
  /** Kartu dari deep link yang ditunda sampai layar pembuka ditutup. */
  pendingReveal: Reveal | null
  toast: Toast | null

  /** Tutup layar pembuka; mengembalikan kartu yang tertunda (bila ada). */
  start: () => Reveal | null
  select: (exhibitId: string | null) => void
  openScanner: () => void
  closeScanner: () => void
  /** Proses hasil scan QR, ketikan kode, atau deep link. */
  claim: (raw: string) => ClaimResult
  viewCard: (exhibitId: string) => void
  closeReveal: () => void
  showToast: (message: string) => void
  dismissToast: (id: number) => void
}

let toastId = 0

/** State alur game (tidak disimpan; progres koleksi ada di discoveryStore). */
export const useGameStore = create<GameState>()((set, get) => ({
  phase: 'intro',
  selectedId: null,
  scanningFor: null,
  reveal: null,
  pendingReveal: null,
  toast: null,

  start: () => {
    const pending = get().pendingReveal
    set({ phase: 'playing', reveal: pending, pendingReveal: null })
    return pending
  },

  select: (exhibitId) => set({ selectedId: exhibitId }),

  openScanner: () => {
    const { selectedId } = get()
    if (selectedId) set({ scanningFor: selectedId })
  },

  closeScanner: () => set({ scanningFor: null }),

  claim: (raw) => {
    const token = extractToken(raw)
    const exhibit = token ? findExhibitByToken(token) : undefined
    if (!exhibit) return { ok: false }

    const isNew = useDiscoveryStore.getState().discover(exhibit.id)
    const { scanningFor, phase } = get()
    const reveal: Reveal = {
      exhibitId: exhibit.id,
      kind: isNew ? 'new' : 'again',
      expectedId: scanningFor && scanningFor !== exhibit.id ? scanningFor : undefined,
    }
    if (phase === 'intro') set({ pendingReveal: reveal, selectedId: exhibit.id })
    else set({ reveal, scanningFor: null, selectedId: exhibit.id })

    vibrate(isNew ? [40, 60, 80] : 30)
    return { ok: true, exhibitId: exhibit.id, isNew }
  },

  viewCard: (exhibitId) => set({ reveal: { exhibitId, kind: 'view' } }),

  closeReveal: () => set({ reveal: null }),

  showToast: (message) => set({ toast: { id: ++toastId, message } }),

  dismissToast: (id) => {
    if (get().toast?.id === id) set({ toast: null })
  },
}))
