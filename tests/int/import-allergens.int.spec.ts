import { describe, it, expect } from 'vitest'

import { parseAllergens } from '@/lib/import-products'
import { ALLERGEN_EU } from '@/lib/contracts'

describe('parseAllergens', () => {
  it('accepts the canonical EU codes', () => {
    const codes = Object.values(ALLERGEN_EU)
    expect(parseAllergens(codes.join(','))).toEqual(codes)
  })

  it('treats "no allergens" wording as an empty list', () => {
    // These used to abort the whole import on the first such row.
    for (const word of ['none', 'No', 'n/a', 'NA', '-', '0', 'nu', 'niciunul', 'nici unul', 'fara', 'Fără', 'ingen']) {
      expect(parseAllergens(word), word).toEqual([])
    }
  })

  it('maps "soy" to the EU code soybeans', () => {
    expect(parseAllergens('milk,gluten,soy,mustard')).toEqual(['milk', 'gluten', 'soybeans', 'mustard'])
  })

  it('accepts Romanian names, with or without diacritics', () => {
    expect(parseAllergens('lapte,ouă,țelină,muștar')).toEqual(['milk', 'eggs', 'celery', 'mustard'])
    expect(parseAllergens('lapte,oua,telina,mustar')).toEqual(['milk', 'eggs', 'celery', 'mustard'])
    expect(parseAllergens('pește,arahide,soia,nuci')).toEqual(['fish', 'peanuts', 'soybeans', 'nuts'])
    expect(parseAllergens('sulfiți,susan,moluște,crustacee')).toEqual([
      'sulphites', 'sesame', 'molluscs', 'crustaceans',
    ])
    expect(parseAllergens('fructe cu coaja')).toEqual(['nuts'])
    expect(parseAllergens('dioxid de sulf')).toEqual(['sulphites'])
  })

  it('accepts Danish names', () => {
    expect(parseAllergens('mælk,æg,fisk,sennep')).toEqual(['milk', 'eggs', 'fish', 'mustard'])
    expect(parseAllergens('nødder,jordnødder,selleri,sesam')).toEqual([
      'nuts', 'peanuts', 'celery', 'sesame',
    ])
    expect(parseAllergens('sulfitter,bløddyr,krebsdyr,soja')).toEqual([
      'sulphites', 'molluscs', 'crustaceans', 'soybeans',
    ])
  })

  it('accepts singular forms and the US "sulfites" spelling', () => {
    expect(parseAllergens('egg,peanut,soybean')).toEqual(['eggs', 'peanuts', 'soybeans'])
    expect(parseAllergens('sulfites')).toEqual(['sulphites'])
  })

  it('trims, ignores blanks, and dedupes across aliases', () => {
    expect(parseAllergens('')).toEqual([])
    expect(parseAllergens('  MILK , , gluten  ')).toEqual(['milk', 'gluten'])
    expect(parseAllergens('milk,lapte,MILK')).toEqual(['milk'])
    expect(parseAllergens('none,milk')).toEqual(['milk'])
  })

  it('still rejects ambiguous and unknown words', () => {
    // "alune" is hazelnuts in most of Romania but peanuts in "alune de pamant",
    // and "scoici" spans molluscs and crustaceans. A wrong allergen is a safety
    // problem, so these must fail loudly rather than be guessed.
    for (const word of ['alune', 'scoici', 'lactoza libera', 'banana']) {
      expect(() => parseAllergens(word), word).toThrow(/Invalid allergen/)
    }
  })

  it('names the accepted codes in the error, to make the sheet fixable', () => {
    expect(() => parseAllergens('banana')).toThrow(/gluten, crustaceans/)
  })
})
