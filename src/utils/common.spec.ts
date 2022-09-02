import BigNumber from 'bignumber.js'
import { expect, test, describe } from 'vitest'
import { formatRate, formatPercent, formatNumberWithCommas } from './common'

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
