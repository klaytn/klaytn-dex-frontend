import { Percent } from '@/core'
import BigNumber from 'bignumber.js'
import { describe, expect, test } from 'vitest'
import { formatNumberWithCommas, formatNumberWithSignificant, numberToPercent } from './common'

describe('format a number with 7 significant positions', () => {
  test.each([
    [1234.0, '1234'],
    [1234.474747, '1234.475'],
    [new BigNumber('1000000000.1234321'), '1000000000.12'],
    [1.0000000099999, '1'],
    [new BigNumber('0.00000000000123456789'), '0.000000000001234568'],
    [0.0010000004, '0.001'],
  ])('Formats %s to %s', (input, output) => {
    expect(formatNumberWithSignificant(input, 7)).toEqual(output)
  })
})

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
