import { Wei } from '@/core/kaikas'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import rfdc from 'rfdc'
import { roundTo } from 'round-to'
import { buildPair, TokensPair } from './pair'

const reallyFastDeepClone = rfdc()

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

export function deepClone<T>(object: T): T {
  return reallyFastDeepClone(object)
}

export function stringHashForHsl(str: string): number {
  return [...str].reduce((a, c) => {
    const h = c.charCodeAt(0) + ((a << 4) - a)
    return h % 360
  }, 0)
}

/**
 * Snake-case seems more suitable here
 */
export interface Rates {
  a_per_b: number
  b_per_a: number
}

export type RatesRounded = {
  [K in keyof Rates]: number
}

export function computeRates(pair: TokensPair<Wei>): Rates {
  const a_per_b = pair.tokenA.asBigNum.dividedBy(pair.tokenB.asBigNum).toNumber()
  const b_per_a = 1 / a_per_b
  return { a_per_b, b_per_a }
}

export function roundRates({ a_per_b, b_per_a }: Rates): RatesRounded {
  return {
    a_per_b: roundTo(a_per_b, 7),
    b_per_a: roundTo(b_per_a, 7),
  }
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
}

export function shortenStringInTheMiddle(string: string) {
  const stringLength = string.length
  return `${string.slice(2, 6)}...${string.slice(stringLength - 6, stringLength - 2)}`
}

