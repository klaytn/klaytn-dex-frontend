import { asWei, ValueWei } from '@/core/kaikas'
import { Serializer } from '@vueuse/core'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import rfdc from 'rfdc'
import { roundTo } from 'round-to'
import { JsonValue } from 'type-fest'
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
  a_per_b: ValueWei<BigNumber>
  b_per_a: ValueWei<BigNumber>
}

export type RatesRounded = {
  [K in keyof Rates]: number
}

export function computeRates(pair: TokensPair<ValueWei<number | string | BigNumber | BN>>): Rates {
  const nums = buildPair((type) => {
    const value = pair[type]
    return new BigNumber(value instanceof BN ? value.toString() : value)
  })
  const a_per_b = asWei(nums.tokenA.dividedBy(nums.tokenB))
  const b_per_a = asWei(new BigNumber(1).dividedBy(a_per_b))
  return { a_per_b, b_per_a }
}

export function roundRates({ a_per_b, b_per_a }: Rates): RatesRounded {
  return {
    a_per_b: roundTo(a_per_b.toNumber(), 7),
    b_per_a: roundTo(b_per_a.toNumber(), 7),
  }
}

export const JSON_SERIALIZER: Serializer<JsonValue> = {
  read: (raw) => JSON.parse(raw),
  write: (parsed) => JSON.stringify(parsed),
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
