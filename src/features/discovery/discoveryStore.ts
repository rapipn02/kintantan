import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { EXHIBITS } from '../exhibits/catalog.ts'

interface DiscoveryState {
  /** exhibitId -> waktu pertama ditemukan (epoch ms). */
  found: Record<string, number>
  /** Tandai exhibit sebagai ditemukan. Mengembalikan `true` bila baru pertama kali. */
  discover: (exhibitId: string) => boolean
  reset: () => void
}

/** Progres koleksi, disimpan di HP pengunjung (localStorage). */
export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set, get) => ({
      found: {},
      discover: (exhibitId) => {
        if (get().found[exhibitId]) return false
        set((state) => ({ found: { ...state.found, [exhibitId]: Date.now() } }))
        return true
      },
      reset: () => set({ found: {} }),
    }),
    {
      name: 'kintantan:discovery',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ found: state.found }),
    },
  ),
)

/** Hanya hitung exhibit yang masih ada di katalog (data lama di HP bisa berisi id yang sudah dihapus). */
export function countFound(found: Record<string, number>): number {
  return EXHIBITS.reduce((total, exhibit) => total + (found[exhibit.id] ? 1 : 0), 0)
}

export const useFoundCount = () => useDiscoveryStore((state) => countFound(state.found))

export const useIsFound = (exhibitId: string) =>
  useDiscoveryStore((state) => Boolean(state.found[exhibitId]))
