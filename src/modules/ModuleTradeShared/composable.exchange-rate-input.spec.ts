import { useInertExchangeRateInput } from './composable.exchange-rate-input'
import { describe, expect, test } from 'vitest'
import { TokenType } from '@/utils/pair'

describe('inert exchange rate', () => {
  function inputFactory<T extends { type: TokenType; value: string } | null>(value: T): T {
    return value
  }

  test('initial state is null', () => {
    const { rates } = useInertExchangeRateInput({ input: ref(null) })

    expect(rates).toEqual({
      tokenA: null,
      tokenB: null,
    })
  })

  test('initial state is set to tokenA', () => {
    const { rates, exchangeRateFor } = useInertExchangeRateInput({
      input: ref(inputFactory({ type: 'tokenA', value: '123' })),
    })

    expect(exchangeRateFor.value).toEqual('tokenB')
    expect(rates).toEqual({
      tokenA: { value: '123', type: 'active' },
      tokenB: null,
    })
  })

  test('input switched to tokenB', () => {
    const input = ref(inputFactory({ type: 'tokenA', value: '123' }))
    const { rates, set, exchangeRateFor } = useInertExchangeRateInput({ input })

    set('tokenB', '456')

    expect(exchangeRateFor.value).toEqual('tokenA')
    expect(input.value).toEqual(inputFactory({ type: 'tokenB', value: '456' }))
    expect(rates).toEqual({
      tokenA: { value: '123', type: 'outdated' },
      tokenB: { value: '456', type: 'active' },
    })
  })

  test('input switched to tokenA back', () => {
    const input = ref(inputFactory(null))
    const { rates, set, exchangeRateFor } = useInertExchangeRateInput({ input })

    set('tokenB', '456')
    set('tokenA', '789')

    expect(exchangeRateFor.value).toEqual('tokenB')
    expect(input.value).toEqual(inputFactory({ type: 'tokenA', value: '789' }))
    expect(rates).toEqual({
      tokenA: { value: '789', type: 'active' },
      tokenB: { value: '456', type: 'outdated' },
    })
  })

  test('input tokenA, then estimated tokenB', () => {
    const input = ref(inputFactory(null))
    const { rates, set, setEstimated } = useInertExchangeRateInput({ input })

    set('tokenA', '123')
    setEstimated('456')

    expect(input.value).toEqual(inputFactory({ type: 'tokenA', value: '123' }))
    expect(rates).toEqual({
      tokenA: { value: '123', type: 'active' },
      tokenB: { value: '456', type: 'estimated' },
    })
  })

  test('input tokenA, then estimated tokenB, then update tokenA', () => {
    const input = ref(inputFactory(null))
    const { rates, set, setEstimated } = useInertExchangeRateInput({ input })

    set('tokenA', '123')
    setEstimated('456')
    set('tokenA', '321')

    expect(input.value).toEqual(inputFactory({ type: 'tokenA', value: '321' }))
    expect(rates).toEqual({
      tokenA: { value: '321', type: 'active' },
      tokenB: { value: '456', type: 'outdated' },
    })
  })

  test('setting estimated when active is not set - throws', () => {
    const input = ref(inputFactory(null))
    const { setEstimated } = useInertExchangeRateInput({ input })

    expect(() => setEstimated('456')).toThrow()
  })
})
