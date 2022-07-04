import { ValueWei } from '@/core/kaikas'
import BigNumber from 'bignumber.js'
import { fromWei } from 'web3-utils'

// FIXME v1 & v2 values comes from `Token.value`. What type is it?

export function formatRate(v1: string, v2: string) {
  const bigNA = new BigNumber(v1)
  const bigNB = new BigNumber(v2)

  return bigNA.dividedBy(bigNB).toFixed(5)
}

export function formatPercent(v1: string, v2: string) {
  const bigNA = new BigNumber(v1)
  const bigNB = new BigNumber(v2)
  const percent = bigNA.dividedToIntegerBy(100)

  return `${bigNB.dividedBy(percent).toFixed(2)}%`
}

export function formatWeiValue(value: ValueWei<string>): string {
  if (!value) return '-'
  const bn = new BigNumber(fromWei(value))
  return bn.toFixed(4)
}

if (import.meta.vitest) {
  const { test, expect, describe } = import.meta.vitest

  describe('format rate', () => {
    test('case 1', () => {
      expect(formatRate('423', '20')).toMatchInlineSnapshot('"21.15000"')
    })

    test('case 2', () => {
      expect(formatRate('1000', '3.5')).toMatchInlineSnapshot('"285.71429"')
    })
  })

  describe('format percent', () => {
    test('case 1', () => {
      expect(formatPercent('423', '20')).toMatchInlineSnapshot('"5.00%"')
    })

    test('case 2', () => {
      expect(formatPercent('1000', '3.5')).toMatchInlineSnapshot('"0.35%"')
    })
  })

  describe('format wei value', () => {
    test('case 1', () => {
      expect(formatWeiValue('1523515128848712348' as ValueWei<string>)).toMatchInlineSnapshot('"1.5235"')
    })
  })
}
