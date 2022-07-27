import { Address, Wei, WeiAsToken } from '@/core/kaikas'
import { describe, test, expect } from 'vitest'
import { buildSwapProps } from './util.swap-props'

const someNonNativeToken1 = '0xb9920BD871e39C6EF46169c32e7AC4C698688881' as Address
const someNonNativeToken2 = '0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a' as Address

describe('Building swap props', () => {
  test('When token A is exact, and none of tokens are native', () => {
    expect(
      buildSwapProps({
        tokenA: {
          addr: someNonNativeToken1,
          input: Wei.fromToken({ decimals: 18 }, '1.423' as WeiAsToken),
        },
        tokenB: {
          addr: someNonNativeToken2,
          input: Wei.fromToken({ decimals: 18 }, '45.42' as WeiAsToken),
        },
        referenceToken: 'tokenA',
      }),
    ).toMatchInlineSnapshot(`
              {
                "addressA": "0xb9920BD871e39C6EF46169c32e7AC4C698688881",
                "addressB": "0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a",
                "amountIn": "1423000000000000000",
                "amountOutMin": "45420000000000000000",
                "mode": "exact-tokens-for-tokens",
              }
            `)
  })

  // TODO cover other cases

  test('Fails if tokens are the same', () => {
    expect(() =>
      buildSwapProps({
        tokenA: {
          addr: someNonNativeToken1,
          input: new Wei(0),
        },
        tokenB: {
          addr: someNonNativeToken1,
          input: new Wei(0),
        },
        referenceToken: 'tokenA',
      }),
    ).toThrowErrorMatchingInlineSnapshot('"Invariant failed: Cannot swap token for itself"')
  })
})
