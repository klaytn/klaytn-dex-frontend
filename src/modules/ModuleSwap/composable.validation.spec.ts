import { describe, expect, test } from 'vitest'
import { asWei } from '@/core/kaikas'
import { WHITELIST_TOKENS } from '@/core/kaikas/const'
import BigNumber from 'bignumber.js'
import { useSwapValidation } from './composable.validation'
import { PairAddressResult } from '../ModuleTradeShared/composable.pair-by-tokens'

const getTwoTokens = () => WHITELIST_TOKENS.slice(2, 4)

describe('swap validation', () => {
  test('When some token is not selected, "Select Token" returned', () => {
    const [tokenA] = getTwoTokens()

    const validation = useSwapValidation({
      tokenA: shallowRef({ ...tokenA, balance: asWei(new BigNumber(0)), input: asWei('141234234000000') }),
      tokenB: shallowRef(null),
      pairAddr: ref(null),
    })

    expect(validation.value).toMatchInlineSnapshot(`
        {
          "kind": "err",
          "message": "Select Token",
        }
      `)
  })

  test('When pair is not computed yet, validation errors', () => {
    const [tokenA, tokenB] = getTwoTokens()

    const validation = useSwapValidation({
      tokenA: shallowRef({ ...tokenA, balance: asWei(new BigNumber(0)), input: asWei('0') }),
      tokenB: shallowRef(tokenB),
      pairAddr: ref(null),
    })

    expect(validation.value).toMatchInlineSnapshot(`
        {
          "kind": "err",
          "message": "Route is not computed yet",
        }
      `)
  })

  test("When tokens are selected, but pair doesn't exist, route error is returned", () => {
    const [tokenA, tokenB] = getTwoTokens()
    const tokens = { tokenA, tokenB }

    const validation = useSwapValidation({
      tokenA: shallowRef({ ...tokenA, balance: asWei(new BigNumber(0)), input: asWei('0') }),
      tokenB: shallowRef(tokenB),
      pairAddr: ref<PairAddressResult>({ kind: 'empty', tokens: { tokenA: tokenA.address, tokenB: tokenB.address } }),
    })

    expect(validation.value).toMatchInlineSnapshot(`
        {
          "kind": "err",
          "message": "Route VEN>EA not found",
        }
      `)
  })

  test('When tokens are the same, validation fails', () => {
    const [tokenA] = getTwoTokens()

    const validation = useSwapValidation({
      tokenA: shallowRef({ ...tokenA, balance: asWei(new BigNumber(0)), input: asWei('0') }),
      tokenB: shallowRef(tokenA),
      pairAddr: ref('empty'),
    })

    expect(validation.value).toMatchInlineSnapshot(`
        {
          "kind": "err",
          "message": "Route VEN>VEN not found",
        }
      `)
  })

  test('When tokenA balance is insufficient, validation fails', () => {
    const [tokenA, tokenB] = getTwoTokens()

    const INPUT = asWei('1001')
    const BALANCE = asWei('1000')

    const validation = useSwapValidation({
      tokenA: shallowRef({ ...tokenA, balance: asWei(new BigNumber(BALANCE)), input: INPUT }),
      tokenB: shallowRef(tokenB),
      pairAddr: ref('not-empty'),
    })

    expect(validation.value).toMatchInlineSnapshot(`
        {
          "kind": "err",
          "message": "Insufficient VEN balance",
        }
      `)
  })
})
