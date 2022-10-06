import BigNumber from 'bignumber.js'
import { expect, test, describe } from 'vitest'
import { formatNumberWithCommas } from './common'

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
