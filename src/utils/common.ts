import { Wei } from '@/core/kaikas'
import { POOL_COMMISSION } from '@/core/kaikas/const'
import { TokenAmount, Percent, Price, Fraction } from '@/core/kaikas/entities'
import { Tab } from '@/types'
import { Serializer } from '@vueuse/core'
import BigNumber from 'bignumber.js'
import rfdc from 'rfdc'
import { roundTo } from 'round-to'
import { JsonValue } from 'type-fest'
import { TokensPair } from './pair'

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

export function computePriceImpact(midPrice: Price, inputAmount: TokenAmount, outputAmount: TokenAmount): Percent {
  const feeCoefficient = new Fraction(1).plus(POOL_COMMISSION)
  const exactQuote = new TokenAmount(
    outputAmount.token,
    midPrice.raw.dividedBy(feeCoefficient).multipliedBy(inputAmount.asFraction).toFixed(outputAmount.currency.decimals),
  )
  const slippage = exactQuote.minus(outputAmount).dividedBy(exactQuote)
  return new Percent(slippage.numerator, slippage.denominator)
}

export const JSON_SERIALIZER: Serializer<JsonValue> = {
  read: (raw) => JSON.parse(raw),
  write: (parsed) => JSON.stringify(parsed),
}

export function nonNullSet<T>(values: (null | undefined | T)[]): Set<T> {
  const set = new Set<T>()
  for (const val of values) {
    if (val !== null && val !== undefined) set.add(val)
  }
  return set
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

export function makeTabsArray(data: string[]): Tab[] {
  return data.map((item) => ({
    id: item,
    label: item,
  }))
}
