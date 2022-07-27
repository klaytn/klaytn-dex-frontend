import { describe, expect, test } from 'vitest'
import { Wei } from '@/core/kaikas'
import { WHITELIST_TOKENS } from '@/core/kaikas/const'
import { useSwapValidation } from './composable.validation'

const getTwoTokens = () => WHITELIST_TOKENS.slice(2, 4)

describe('swap validation', () => {
  test('When some token is not selected, "Select Token" returned', () => {
    const [tokenA] = getTwoTokens()

    const validation = useSwapValidation({
      tokenA: shallowRef({ ...tokenA, balance: new Wei(0), input: new Wei('141234234000000') }),
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
      tokenA: shallowRef({ ...tokenA, balance: new Wei(0), input: new Wei('0') }),
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

    const validation = useSwapValidation({
      tokenA: shallowRef({ ...tokenA, balance: new Wei(0), input: new Wei(0) }),
      tokenB: shallowRef(tokenB),
      pairAddr: ref('empty'),
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
      tokenA: shallowRef({ ...tokenA, balance: new Wei(0), input: new Wei(0) }),
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

    const INPUT = new Wei(1001)
    const BALANCE = new Wei(1000)

    const validation = useSwapValidation({
      tokenA: shallowRef({ ...tokenA, balance: BALANCE, input: INPUT }),
      tokenB: shallowRef(tokenB),
      pairAddr: ref('exist'),
    })

    expect(validation.value).toMatchInlineSnapshot(`
        {
          "kind": "err",
          "message": "Insufficient VEN balance",
        }
      `)
  })
})
