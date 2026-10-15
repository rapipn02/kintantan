import { EXHIBITS } from './data/exhibits.ts'
import { SPECIES } from './data/species.ts'
import type { Exhibit, Species } from './types.ts'

const exhibitsById = new Map(EXHIBITS.map((e) => [e.id, e]))
const exhibitsByToken = new Map(EXHIBITS.map((e) => [e.token, e]))
const speciesById = new Map(SPECIES.map((s) => [s.id, s]))
const exhibitNumbers = new Map(EXHIBITS.map((e, index) => [e.id, index + 1]))

export const TOTAL_EXHIBITS = EXHIBITS.length

export function getExhibit(id: string): Exhibit | undefined {
  return exhibitsById.get(id)
}

/** Nomor urut kartu koleksi (#01, #02, ...). */
export function getExhibitNumber(id: string): number {
  return exhibitNumbers.get(id) ?? 0
}

export function findExhibitByToken(token: string): Exhibit | undefined {
  return exhibitsByToken.get(token.toLowerCase())
}

export function getSpecies(exhibit: Exhibit): Species {
  const species = speciesById.get(exhibit.speciesId)
  if (!species)
    throw new Error(`Spesies "${exhibit.speciesId}" untuk exhibit "${exhibit.id}" tidak ada`)
  return species
}

export { EXHIBITS, SPECIES }
