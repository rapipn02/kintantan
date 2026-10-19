import { create } from 'zustand'
import { findExhibitByToken, getExhibit } from '../features/exhibits/catalog.ts'
import { useDiscoveryStore } from '../features/discovery/discoveryStore.ts'
import { extractToken } from '../features/scanner/parseScanResult.ts'
import { vibrate } from '../shared/lib/haptics.ts'
import { readFlag, writeFlag } from '../shared/lib/storage.ts'

/**
 * Tur pengenalan (macan pemandu) otomatis tampil sekali, saat pertama kali bermain.
 * Sengaja berbeda dari flag lama `kintantan:help-seen`, supaya pengunjung yang sudah menutup
 * petunjuk versi lama tetap melihat tur baru.
 */
export const TOUR_SEEN_KEY = 'kintantan:tour-seen'

/**
 * MODE DEMO (sementara): kode apa pun yang discan/diketik di scanner aplikasi membuka kartu hewan.
 * Kode yang tidak dikenal membuka hewan yang sedang dipilih, atau `fallbackExhibitId` bila scanner
 * dibuka dari tombol QR umum. Deep link `/s/<token>` tetap ketat. Set `acceptAnyCode: false` untuk
 * kembali ke perilaku normal.
 */
export const DEMO = {
  acceptAnyCode: true,
  /** Satu-satunya hewan yang sudah punya desain kartu. */
  fallbackExhibitId: 'beruang-madu',
}

/** new = baru ditemukan, again = scan ulang kandang yang sama, view = buka kartu dari panel. */
export type RevealKind = 'new' | 'again' | 'view'

export interface Reveal {
  exhibitId: string
  kind: RevealKind
  /** Hewan yang sedang dipilih saat scan, bila QR yang discan ternyata milik hewan lain. */
  expectedId?: string
  /** Tampilkan popup "Pindai berhasil" dulu sebelum kartu (hanya setelah scan). */
  celebrate?: boolean
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
  /** Ketuk hewan di peta: belum ditemukan → langsung kamera; sudah ditemukan → kartunya. */
  openExhibit: (exhibitId: string) => void
  /** Buka kamera untuk hewan tertentu, atau untuk QR kandang mana pun (`null`). */
  openScanner: (targetId: string | null) => void
  closeScanner: () => void
  closeTour: () => void
  openHelp: () => void
  closeHelp: () => void
  /** Proses hasil scan QR, ketikan kode, atau deep link. */
  claim: (raw: string) => ClaimResult
  viewCard: (exhibitId: string) => void
  /** Popup "Pindai berhasil" selesai: lanjut ke kartu hewan. */
  endCelebrate: () => void
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
    const showTour = !pending && !readFlag(TOUR_SEEN_KEY)
    set({ phase: 'playing', reveal: pending, pendingReveal: null, tourOpen: showTour })
    return pending
  },

  select: (exhibitId) => set({ selectedId: exhibitId }),

  openExhibit: (exhibitId) => {
    const found = useDiscoveryStore.getState().found[exhibitId] !== undefined
    set(
      found
        ? { selectedId: exhibitId, reveal: { exhibitId, kind: 'view' } }
        : { selectedId: exhibitId, scanner: { targetId: exhibitId } },
    )
  },

  openScanner: (targetId) => set({ scanner: { targetId } }),

  closeScanner: () => set({ scanner: null, selectedId: null }),

  closeTour: () => {
    writeFlag(TOUR_SEEN_KEY)
    set({ tourOpen: false })
  },

  openHelp: () => set({ helpOpen: true }),

  closeHelp: () => set({ helpOpen: false }),

  claim: (raw) => {
    const token = extractToken(raw)
    const { scanner, phase } = get()
    const targetId = scanner?.targetId
    let exhibit = token ? findExhibitByToken(token) : undefined
    // Mode demo hanya untuk scanner di dalam aplikasi (fase bermain), bukan deep link.
    if (!exhibit && DEMO.acceptAnyCode && phase === 'playing' && raw.trim()) {
      exhibit = getExhibit(targetId ?? DEMO.fallbackExhibitId)
    }
    if (!exhibit) return { ok: false }

    const isNew = useDiscoveryStore.getState().discover(exhibit.id)
    const reveal: Reveal = {
      exhibitId: exhibit.id,
      kind: isNew ? 'new' : 'again',
      expectedId: targetId && targetId !== exhibit.id ? targetId : undefined,
      celebrate: true,
    }
    if (phase === 'intro') set({ pendingReveal: reveal, selectedId: exhibit.id })
    else set({ reveal, scanner: null, selectedId: exhibit.id })

    vibrate(isNew ? [40, 60, 80] : 30)
    return { ok: true, exhibitId: exhibit.id, isNew }
  },

  viewCard: (exhibitId) => set({ reveal: { exhibitId, kind: 'view' } }),

  endCelebrate: () => {
    const reveal = get().reveal
    if (reveal?.celebrate) set({ reveal: { ...reveal, celebrate: false } })
  },

  // Toast status kartu ikut ditutup supaya tidak menutupi layar berikutnya.
  closeReveal: () => set({ reveal: null, toast: null, selectedId: null }),

  showToast: (message) => set({ toast: { id: ++toastId, message } }),

  dismissToast: (id) => {
    if (get().toast?.id === id) set({ toast: null })
  },
}))
