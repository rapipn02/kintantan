import { describe, expect, it } from 'vitest'
import { extractToken, tokenFromPath } from './parseScanResult.ts'

describe('extractToken', () => {
  it.each([
    ['https://kintantan.example.com/s/a7n2drux', 'a7n2drux'],
    ['https://staging.kintantan.pages.dev/s/a7n2drux/', 'a7n2drux'],
    ['http://192.168.1.5:5173/s/a7n2drux', 'a7n2drux'],
    ['  https://kintantan.example.com/s/A7N2DRUX  ', 'a7n2drux'],
    ['a7n2drux', 'a7n2drux'],
    ['A7N2DRUX', 'a7n2drux'],
  ])('menerima %s', (raw, expected) => {
    expect(extractToken(raw)).toBe(expected)
  })

  it.each([
    '',
    'halo dunia',
    'https://kintantan.example.com/',
    'https://kintantan.example.com/s/',
    'https://kintantan.example.com/s/a7n2drux/extra',
    'https://kintantan.example.com/x/a7n2drux',
    'ftp://kintantan.example.com/s/a7n2drux',
    'javascript:alert(1)',
    'a7n2dru', // terlalu pendek
    'a7n2druxx', // terlalu panjang
    'a0n2drux', // karakter ambigu (0)
    'WIFI:S:zoo;T:WPA;P:secret;;',
  ])('menolak %j', (raw) => {
    expect(extractToken(raw)).toBeNull()
  })
})

describe('tokenFromPath', () => {
  it('membaca deep link', () => {
    expect(tokenFromPath('/s/a7n2drux')).toBe('a7n2drux')
    expect(tokenFromPath('/s/a7n2drux/')).toBe('a7n2drux')
  })

  it('mengabaikan path lain', () => {
    expect(tokenFromPath('/')).toBeNull()
    expect(tokenFromPath('/s/bukan-token')).toBeNull()
  })
})
