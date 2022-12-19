import { describe, expect, test } from 'vitest'
import { NATIVE_TOKEN, isNativeToken } from '../const'
import { Address } from '../types'

describe('isNativeToken()', () => {
  test('it ignores case', () => {
    expect(isNativeToken(NATIVE_TOKEN.toUpperCase() as Address)).toBe(true)
  })
})
