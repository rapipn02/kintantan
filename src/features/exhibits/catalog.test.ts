import { describe, expect, it } from 'vitest'
import { extractToken } from '../scanner/parseScanResult.ts'
import { EXHIBITS, findExhibitByToken, getSpecies, SPECIES } from './catalog.ts'

describe('data exhibit', () => {
  it('id dan token unik', () => {
    expect(new Set(EXHIBITS.map((e) => e.id)).size).toBe(EXHIBITS.length)
    expect(new Set(EXHIBITS.map((e) => e.token)).size).toBe(EXHIBITS.length)
  })

  it('setiap token lolos validasi scanner dan bisa ditemukan kembali', () => {
    for (const exhibit of EXHIBITS) {
      expect(extractToken(exhibit.token)).toBe(exhibit.token)
      expect(findExhibitByToken(exhibit.token)).toBe(exhibit)
    }
  })

  it('setiap exhibit menunjuk spesies yang ada', () => {
    for (const exhibit of EXHIBITS) expect(() => getSpecies(exhibit)).not.toThrow()
  })

  it('tidak ada spesies yang tidak dipakai', () => {
    const used = new Set(EXHIBITS.map((e) => e.speciesId))
    expect(SPECIES.filter((s) => !used.has(s.id))).toEqual([])
  })

  it('posisi berada di dalam peta', () => {
    for (const { id, box } of EXHIBITS) {
      expect(box.x, id).toBeGreaterThanOrEqual(0)
      expect(box.y, id).toBeGreaterThanOrEqual(0)
      expect(box.w, id).toBeGreaterThan(0)
      expect(box.h, id).toBeGreaterThan(0)
      expect(box.x + box.w, id).toBeLessThanOrEqual(1)
      expect(box.y + box.h, id).toBeLessThanOrEqual(1)
    }
  })
})
