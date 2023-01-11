import { Percent, TokenAmount } from '@/core'
import { Tab } from '@/types'
import BigNumber from 'bignumber.js'
import rfdc from 'rfdc'
import { roundTo } from 'round-to'
import { TokensPair } from './pair'

const reallyFastDeepClone = rfdc()

export function deepClone<T>(object: T): T {
  return reallyFastDeepClone(object)
}

export function arrayEquals<T>(a: T[], b: T[]): boolean {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((val, index) => val === b[index])
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

export function computeRates(pair: TokensPair<TokenAmount>): Rates {
  const a_per_b = pair.tokenA.quotient.dividedBy(pair.tokenB.quotient).toNumber()
  const b_per_a = 1 / a_per_b
  return { a_per_b, b_per_a }
}

export function roundRates({ a_per_b, b_per_a }: Rates): RatesRounded {
  return {
    a_per_b: roundTo(a_per_b, 7),
    b_per_a: roundTo(b_per_a, 7),
  }
}

export function nonNullSet<T>(values: (null | undefined | T)[]): Set<T> {
  const set = new Set<T>()
  for (const val of values) {
    if (val !== null && val !== undefined) set.add(val)
  }
  return set
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

export function formatNumberWithSignificant(value: string | number | BigNumber, significant: number): string {
  const valueBigNumber = BigNumber(value)
  const valueStr = valueBigNumber.toFixed()
  let done = false
  let i = 0
  let significantFound = 0
  let decimals = 0
  let afterPoint = false
  while (!done) {
    const char = valueStr[i]
    const isPeriod = char === '.'
    if (!isPeriod) {
      if (significantFound === 0 && char !== '0') significantFound = 1
      else if (significantFound > 0) significantFound++
    }
    if (afterPoint) decimals++
    if ((significantFound >= significant && decimals >= 2) || valueStr.length - 1 <= i) done = true
    i++
    if (isPeriod) afterPoint = true
  }
  return trimTrailingZerosWithPeriod(valueBigNumber.toFixed(decimals))
}

export function formatNumberWithCommas(value: string | number | BigNumber): string {
  const a = value.toString().split('.')
  const beforePeriod = a[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const periodAndDecimals = a[1] ? '.' + a[1] : ''
  return beforePeriod + periodAndDecimals
}

/**
 * Transforms a number from `0.005` to `0.5%` with given precision.
 */
export function numberToPercent(num: number, precision: number): Percent {
  const pow = 10 ** precision
  return new Percent(num * pow, pow)
}

export function trimTrailingZerosWithPeriod(input: string): string {
  let firstNonZeroIndex: undefined | number
  let periodIndex: undefined | number
  for (let i = input.length - 1, char = input[i]; i > 0; i--, char = input[i]) {
    if (char === '.') {
      periodIndex = i
      break
    }
    if (!firstNonZeroIndex && char !== '0') firstNonZeroIndex = i
  }
  return periodIndex ? (firstNonZeroIndex ? input.slice(0, firstNonZeroIndex + 1) : input.slice(0, periodIndex)) : input
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  describe('Trim trailing zeros', () => {
    test.each([
      ['0.0', '0'],
      ['12230000', '12230000'],
      ['1.2000', '1.2'],
      ['0', '0'],
      ['7.001', '7.001'],
      ['1.00000', '1'],
    ])('%o is trimmed into %o', (a, b) => {
      expect(trimTrailingZerosWithPeriod(a)).toEqual(b)
    })
  })
}
