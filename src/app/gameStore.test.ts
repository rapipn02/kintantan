import { beforeEach, describe, expect, it } from 'vitest'
import { EXHIBITS } from '../features/exhibits/catalog.ts'
import { countFound, useDiscoveryStore } from '../features/discovery/discoveryStore.ts'
import { HELP_SEEN_KEY, useGameStore } from './gameStore.ts'

const [lion, bear] = [
  EXHIBITS.find((e) => e.id === 'singa')!,
  EXHIBITS.find((e) => e.id === 'beruang-madu')!,
]
const initial = useGameStore.getState()

beforeEach(() => {
  useGameStore.setState(initial, true)
  useDiscoveryStore.setState({ found: {} })
})

const startPlaying = () => useGameStore.getState().start()

describe('claim', () => {
  it('hewan baru: masuk koleksi & kartu "new" muncul', () => {
    startPlaying()
    const result = useGameStore.getState().claim(`https://zoo.example/s/${lion.token}`)
    expect(result).toEqual({ ok: true, exhibitId: lion.id, isNew: true })
    expect(useGameStore.getState().reveal).toEqual({
      exhibitId: lion.id,
      kind: 'new',
      expectedId: undefined,
    })
    expect(useDiscoveryStore.getState().found[lion.id]).toBeTypeOf('number')
  })

  it('scan ulang: kartu "again", koleksi tidak bertambah', () => {
    startPlaying()
    useGameStore.getState().claim(lion.token)
    useGameStore.getState().claim(lion.token)
    expect(useGameStore.getState().reveal?.kind).toBe('again')
    expect(countFound(useDiscoveryStore.getState().found)).toBe(1)
  })

  it('QR hewan lain saat memilih singa: tetap unlock hewan yang discan', () => {
    startPlaying()
    useGameStore.getState().select(lion.id)
    useGameStore.getState().openScanner(lion.id)
    useGameStore.getState().claim(bear.token)
    const state = useGameStore.getState()
    expect(state.reveal).toEqual({ exhibitId: bear.id, kind: 'new', expectedId: lion.id })
    expect(state.scanner).toBeNull()
    expect(state.selectedId).toBe(bear.id)
  })

  it('tombol Scan Barcode umum: tidak ada catatan "bukan hewan ini"', () => {
    startPlaying()
    useGameStore.getState().openScanner(null)
    useGameStore.getState().claim(bear.token)
    expect(useGameStore.getState().reveal).toEqual({
      exhibitId: bear.id,
      kind: 'new',
      expectedId: undefined,
    })
    expect(useGameStore.getState().scanner).toBeNull()
  })

  it('QR asing ditolak tanpa mengubah state', () => {
    startPlaying()
    expect(useGameStore.getState().claim('https://wifi.example/login')).toEqual({ ok: false })
    expect(useGameStore.getState().reveal).toBeNull()
  })

  it('deep link sebelum layar pembuka ditutup: kartu ditunda sampai start', () => {
    useGameStore.getState().claim(lion.token)
    expect(useGameStore.getState().reveal).toBeNull()
    const pending = useGameStore.getState().start()
    expect(pending?.exhibitId).toBe(lion.id)
    expect(useGameStore.getState().reveal?.exhibitId).toBe(lion.id)
  })
})

describe('discovery store', () => {
  it('menyimpan progres ke localStorage', () => {
    useDiscoveryStore.getState().discover(lion.id)
    expect(localStorage.getItem('kintantan:discovery')).toContain(lion.id)
  })

  it('mengabaikan id lama yang sudah tidak ada di katalog', () => {
    expect(countFound({ [lion.id]: 1, 'hewan-dihapus': 1 })).toBe(1)
  })
})

describe('petunjuk penggunaan', () => {
  it('tampil otomatis saat pertama main, lalu tidak lagi setelah ditutup', () => {
    startPlaying()
    expect(useGameStore.getState().helpOpen).toBe(true)
    useGameStore.getState().closeHelp()
    expect(localStorage.getItem(HELP_SEEN_KEY)).toBe('1')

    useGameStore.setState(initial, true)
    startPlaying()
    expect(useGameStore.getState().helpOpen).toBe(false)
  })

  it('tidak menutupi kartu bagi pengunjung yang datang dari link QR', () => {
    useGameStore.getState().claim(lion.token)
    startPlaying()
    expect(useGameStore.getState().reveal?.exhibitId).toBe(lion.id)
    expect(useGameStore.getState().helpOpen).toBe(false)
  })
})
