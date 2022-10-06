import { Percent } from '@/core'
import BigNumber from 'bignumber.js'
import { expect, test, describe } from 'vitest'
import { formatNumberWithCommas, numberToPercent } from './common'

describe('number with commas', () => {
  test.each([
    [0, '0'],
    [1234, '1,234'],
    [123_123.123, '123,123.123'],
    ['12345612', '12,345,612'],
    ['12345612', '12,345,612'],
    ['12123.41', '12,123.41'],
    [new BigNumber(0), '0'],
    [new BigNumber(12_123_123), '12,123,123'],
    [new BigNumber(12_123_123.012), '12,123,123.012'],
  ])('Formats %s to %s', (input, output) => {
    expect(formatNumberWithCommas(input)).toEqual(output)
  })
})

describe('number to percent', () => {
  test.each([
    [0, 2, new Percent(0, 1)],
    [0.5, 2, new Percent(50, 100)],
    [0.77123, 3, new Percent(771, 1000)],
    [0.12, 10, new Percent(0.12 * 10 ** 10, 10 ** 10)],
  ])('Number %o with precision %o comes to percent %o', (num, precision, percent) => {
    expect(numberToPercent(num, precision).quotient.toFixed()).toEqual(percent.quotient.toFixed())
  })
})
