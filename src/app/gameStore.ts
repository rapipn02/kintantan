import { create } from 'zustand'
import { findExhibitByToken } from '../features/exhibits/catalog.ts'
import { useDiscoveryStore } from '../features/discovery/discoveryStore.ts'
import { extractToken } from '../features/scanner/parseScanResult.ts'
import { vibrate } from '../shared/lib/haptics.ts'
import { readFlag, writeFlag } from '../shared/lib/storage.ts'

/** Tur pengenalan (macan pemandu) otomatis tampil sekali, saat pertama kali bermain. */
export const HELP_SEEN_KEY = 'kintantan:help-seen'

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

interface ScannerState {
  /** Hewan yang dipilih sebelum scan; null bila dibuka dari tombol "Scan Barcode". */
  targetId: string | null
}

interface GameState {
  phase: 'intro' | 'playing'
  selectedId: string | null
  /** null = kamera tertutup. */
  scanner: ScannerState | null
  /** Tur pengenalan: menyorot skor, tombol QR, lihat seluruh peta, dan panduan. */
  tourOpen: boolean
  /** Petunjuk Penggunaan lengkap (tombol info). */
  helpOpen: boolean
  reveal: Reveal | null
  /** Kartu dari deep link yang ditunda sampai layar pembuka ditutup. */
  pendingReveal: Reveal | null
  toast: Toast | null

  /** Tutup layar pembuka; mengembalikan kartu yang tertunda (bila ada). */
  start: () => Reveal | null
  select: (exhibitId: string | null) => void
  /** Buka kamera untuk hewan tertentu, atau untuk QR kandang mana pun (`null`). */
  openScanner: (targetId: string | null) => void
  closeScanner: () => void
  closeTour: () => void
  openHelp: () => void
  closeHelp: () => void
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
  scanner: null,
  tourOpen: false,
  helpOpen: false,
  reveal: null,
  pendingReveal: null,
  toast: null,

  start: () => {
    const pending = get().pendingReveal
    // Yang datang dari QR langsung melihat kartunya; panduan bisa dibuka nanti dari tombol info.
    const showTour = !pending && !readFlag(HELP_SEEN_KEY)
    set({ phase: 'playing', reveal: pending, pendingReveal: null, tourOpen: showTour })
    return pending
  },

  select: (exhibitId) => set({ selectedId: exhibitId }),

  openScanner: (targetId) => set({ scanner: { targetId } }),

  closeScanner: () => set({ scanner: null }),

  closeTour: () => {
    writeFlag(HELP_SEEN_KEY)
    set({ tourOpen: false })
  },

  openHelp: () => set({ helpOpen: true }),

  closeHelp: () => {
    writeFlag(HELP_SEEN_KEY)
    set({ helpOpen: false })
  },

  claim: (raw) => {
    const token = extractToken(raw)
    const exhibit = token ? findExhibitByToken(token) : undefined
    if (!exhibit) return { ok: false }

    const isNew = useDiscoveryStore.getState().discover(exhibit.id)
    const { scanner, phase } = get()
    const targetId = scanner?.targetId
    const reveal: Reveal = {
      exhibitId: exhibit.id,
      kind: isNew ? 'new' : 'again',
      expectedId: targetId && targetId !== exhibit.id ? targetId : undefined,
    }
    if (phase === 'intro') set({ pendingReveal: reveal, selectedId: exhibit.id })
    else set({ reveal, scanner: null, selectedId: exhibit.id })

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
