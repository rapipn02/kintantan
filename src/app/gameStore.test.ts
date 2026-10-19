import { beforeEach, describe, expect, it } from 'vitest'
import { EXHIBITS } from '../features/exhibits/catalog.ts'
import { countFound, useDiscoveryStore } from '../features/discovery/discoveryStore.ts'
import { DEMO, TOUR_SEEN_KEY, useGameStore } from './gameStore.ts'

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
      celebrate: true,
    })
    expect(useDiscoveryStore.getState().found[lion.id]).toBeTypeOf('number')
  })

  it('popup "Pindai berhasil" dulu, lalu kartu; buka kartu dari panel tanpa popup', () => {
    startPlaying()
    useGameStore.getState().claim(lion.token)
    useGameStore.getState().endCelebrate()
    expect(useGameStore.getState().reveal).toMatchObject({ exhibitId: lion.id, celebrate: false })

    useGameStore.getState().closeReveal()
    useGameStore.getState().viewCard(lion.id)
    expect(useGameStore.getState().reveal).toEqual({ exhibitId: lion.id, kind: 'view' })
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
    expect(state.reveal).toEqual({
      exhibitId: bear.id,
      kind: 'new',
      expectedId: lion.id,
      celebrate: true,
    })
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
      celebrate: true,
    })
    expect(useGameStore.getState().scanner).toBeNull()
  })

  it('mode normal: QR asing ditolak tanpa mengubah state', () => {
    DEMO.acceptAnyCode = false
    try {
      startPlaying()
      expect(useGameStore.getState().claim('https://wifi.example/login')).toEqual({ ok: false })
      expect(useGameStore.getState().reveal).toBeNull()
    } finally {
      DEMO.acceptAnyCode = true
    }
  })

  it('mode demo: kode sembarang membuka hewan yang dipilih, atau Beruang Madu', () => {
    startPlaying()
    useGameStore.getState().openScanner(lion.id)
    expect(useGameStore.getState().claim('https://wifi.example/login')).toMatchObject({
      ok: true,
      exhibitId: lion.id,
    })
    useGameStore.getState().closeReveal()

    useGameStore.getState().openScanner(null)
    expect(useGameStore.getState().claim('kodeasal')).toMatchObject({
      ok: true,
      exhibitId: DEMO.fallbackExhibitId,
    })
    expect(useGameStore.getState().reveal?.expectedId).toBeUndefined()
  })

  it('mode demo tidak berlaku untuk deep link sebelum mulai main', () => {
    expect(useGameStore.getState().claim('zzzzzzzz')).toEqual({ ok: false })
    expect(useGameStore.getState().pendingReveal).toBeNull()
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

describe('tur pengenalan', () => {
  it('tampil otomatis saat pertama main, lalu tidak lagi setelah selesai', () => {
    startPlaying()
    expect(useGameStore.getState().tourOpen).toBe(true)
    // Petunjuk lengkap tidak ikut terbuka; hanya lewat tombol info.
    expect(useGameStore.getState().helpOpen).toBe(false)
    useGameStore.getState().closeTour()
    expect(localStorage.getItem(TOUR_SEEN_KEY)).toBe('1')

    useGameStore.setState(initial, true)
    startPlaying()
    expect(useGameStore.getState().tourOpen).toBe(false)
  })

  it('tetap tampil bagi yang sudah menutup petunjuk versi lama', () => {
    localStorage.setItem('kintantan:help-seen', '1')
    startPlaying()
    expect(useGameStore.getState().tourOpen).toBe(true)
  })

  it('membuka petunjuk lengkap tidak menandai tur sudah dilihat', () => {
    useGameStore.getState().openHelp()
    useGameStore.getState().closeHelp()
    expect(localStorage.getItem(TOUR_SEEN_KEY)).toBeNull()
  })

  it('tidak menutupi kartu bagi pengunjung yang datang dari link QR', () => {
    useGameStore.getState().claim(lion.token)
    startPlaying()
    expect(useGameStore.getState().reveal?.exhibitId).toBe(lion.id)
    expect(useGameStore.getState().tourOpen).toBe(false)
  })
})
