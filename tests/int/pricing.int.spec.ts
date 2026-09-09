import { describe, it, expect } from 'vitest'

import {
  formatNetVolume,
  formatNetWeight,
  pricePerKgDkk,
  pricePerLitreDkk,
} from '@/lib/pricing'

describe('pricePerKgDkk', () => {
  it('scales a pack price up to a kilogram', () => {
    expect(pricePerKgDkk(11.95, 200)).toBe(59.75)
    expect(pricePerKgDkk(24.95, 500)).toBe(49.9)
    expect(pricePerKgDkk(8.5, 250)).toBe(34)
  })

  it('leaves a 1 kg pack at its own price', () => {
    expect(pricePerKgDkk(49.95, 1000)).toBe(49.95)
  })

  it('handles packs heavier than a kilo', () => {
    expect(pricePerKgDkk(60, 1500)).toBe(40)
  })

  it('rounds to 2 decimals like the rest of the price math', () => {
    // 19.95 / 0.3 = 66.4999... -> 66.5
    expect(pricePerKgDkk(19.95, 300)).toBe(66.5)
    // 10 / 0.35 = 28.5714... -> 28.57
    expect(pricePerKgDkk(10, 350)).toBe(28.57)
  })

  it('returns null when there is no usable weight', () => {
    expect(pricePerKgDkk(49.95, null)).toBeNull()
    expect(pricePerKgDkk(49.95, undefined)).toBeNull()
    expect(pricePerKgDkk(49.95, 0)).toBeNull()
    expect(pricePerKgDkk(49.95, -200)).toBeNull()
  })
})

describe('formatNetWeight', () => {
  it('uses grams below a kilogram', () => {
    expect(formatNetWeight(200)).toBe('200 g')
    expect(formatNetWeight(999)).toBe('999 g')
  })

  it('switches to kilograms at 1000 g, with a da-DK decimal comma', () => {
    expect(formatNetWeight(1000)).toBe('1 kg')
    expect(formatNetWeight(1200)).toBe('1,2 kg')
    expect(formatNetWeight(2500)).toBe('2,5 kg')
  })

  it('returns null when there is no usable weight', () => {
    expect(formatNetWeight(null)).toBeNull()
    expect(formatNetWeight(undefined)).toBeNull()
    expect(formatNetWeight(0)).toBeNull()
  })
})

describe('pricePerLitreDkk', () => {
  it('scales a pack price up to a litre', () => {
    expect(pricePerLitreDkk(23.32, 1000)).toBe(23.32)
    expect(pricePerLitreDkk(14.97, 1500)).toBe(9.98)
    expect(pricePerLitreDkk(15.5, 250)).toBe(62)
  })

  it('handles jars and multi-litre bottles', () => {
    expect(pricePerLitreDkk(42.47, 720)).toBe(58.99)
    expect(pricePerLitreDkk(35, 2500)).toBe(14)
  })

  it('returns null when there is no usable volume', () => {
    expect(pricePerLitreDkk(23.32, null)).toBeNull()
    expect(pricePerLitreDkk(23.32, 0)).toBeNull()
    expect(pricePerLitreDkk(23.32, -500)).toBeNull()
  })

  it('is NOT interchangeable with the per-kg figure', () => {
    // A litre of sunflower oil weighs ~920 g, so the two answers differ by ~8%.
    // This is why weight and volume are separate fields rather than one number.
    const perLitre = pricePerLitreDkk(23.32, 1000)
    const perKgIfItWere920g = pricePerKgDkk(23.32, 920)
    expect(perLitre).toBe(23.32)
    expect(perKgIfItWere920g).toBe(25.35)
  })
})

describe('formatNetVolume', () => {
  it('uses millilitres below a litre', () => {
    expect(formatNetVolume(250)).toBe('250 ml')
    expect(formatNetVolume(720)).toBe('720 ml')
    expect(formatNetVolume(999)).toBe('999 ml')
  })

  it('switches to litres at 1000 ml, with a da-DK decimal comma', () => {
    expect(formatNetVolume(1000)).toBe('1 l')
    expect(formatNetVolume(1500)).toBe('1,5 l')
    expect(formatNetVolume(2500)).toBe('2,5 l')
  })

  it('returns null when there is no usable volume', () => {
    expect(formatNetVolume(null)).toBeNull()
    expect(formatNetVolume(undefined)).toBeNull()
    expect(formatNetVolume(0)).toBeNull()
  })
})
