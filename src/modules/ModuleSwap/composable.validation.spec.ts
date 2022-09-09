import { describe, expect, test } from 'vitest'
import { Wei, WHITELIST_TOKENS } from '@/core'
import { useSwapValidation } from './composable.validation'
import { Ref } from 'vue'
import { UseTradeResult } from './composable.trade'

const getTwoTokens = () => WHITELIST_TOKENS.slice(2, 4)

const tradeRef = (value: null | UseTradeResult['kind']): Ref<Pick<UseTradeResult, 'kind'> | null> =>
  ref(value && { kind: value })

describe('swap validation', () => {
  test('When some token is not selected, "Select Token" returned', () => {
    const [tokenA] = getTwoTokens()

    const validation = useSwapValidation({
      tokenA: shallowRef({ ...tokenA, balance: new Wei(0), input: new Wei('141234234000000') }),
      tokenB: shallowRef(null),
      trade: tradeRef(null),
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
      tokenA: shallowRef({ ...tokenA, balance: new Wei(0), input: new Wei('0') }),
      tokenB: shallowRef(tokenB),
      trade: tradeRef(null),
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

    const validation = useSwapValidation({
      tokenA: shallowRef({ ...tokenA, balance: new Wei(0), input: new Wei(0) }),
      tokenB: shallowRef(tokenB),
      trade: tradeRef('empty'),
    })

    expect(validation.value).toMatchInlineSnapshot(`
      {
        "kind": "err",
        "message": "Route VEN > EA not found",
      }
    `)
  })

  test('When tokens are the same, validation fails', () => {
    const [tokenA] = getTwoTokens()

    const validation = useSwapValidation({
      tokenA: shallowRef({ ...tokenA, balance: new Wei(0), input: new Wei(0) }),
      tokenB: shallowRef(tokenA),
      trade: tradeRef('empty'),
    })

    expect(validation.value).toMatchInlineSnapshot(`
      {
        "kind": "err",
        "message": "Route VEN > VEN not found",
      }
    `)
  })

  test('When tokenA balance is insufficient, validation fails', () => {
    const [tokenA, tokenB] = getTwoTokens()

    const INPUT = new Wei(1001)
    const BALANCE = new Wei(1000)

    const validation = useSwapValidation({
      tokenA: shallowRef({ ...tokenA, balance: BALANCE, input: INPUT }),
      tokenB: shallowRef(tokenB),
      trade: tradeRef('exist'),
    })

    expect(validation.value).toMatchInlineSnapshot(`
        {
          "kind": "err",
          "message": "Insufficient VEN balance",
        }
      `)
  })
})
