import { useEstimatedLayer, usePairInput } from './composable.pair-input'
import { Mock, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { TokensPair, buildPair, emptyPair } from '@/utils/pair'
import { Address, WeiAsToken } from '@/core'

const emptyTokenPair = (): TokensPair<null | WeiAsToken> => emptyPair()

vi.mock('@/store/tokens', () => {
  const store = {
    findTokenData: vi.fn(),
    lookupUserBalance: vi.fn(),
  }

  return { useTokensStore: () => store }
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('usePairInput()', () => {
  const TOKENS = {
    tokenA: {
      address: '0xb9920BD871e39C6EF46169c32e7AC4C698688881' as Address,
      name: 'Mercury',
      symbol: 'MER',
      decimals: 18,
    },
    tokenB: {
      address: '0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a' as Address,
      name: 'Venus',
      symbol: 'VEN',
      decimals: 20,
    },
  }

  beforeEach(() => {
    const { findTokenData } = useTokensStore()

    ;(findTokenData as Mock).mockImplementation((addr: Address) =>
      addr === TOKENS.tokenA.address ? TOKENS.tokenA : addr === TOKENS.tokenB.address ? TOKENS.tokenB : null,
    )
  })

  test('initial addrs are empty', () => {
    const { addrs } = usePairInput()

    expect(addrs).toMatchInlineSnapshot(`
      {
        "tokenA": null,
        "tokenB": null,
      }
    `)
  })

  test('`completeWeiPair` exists when both tokens are set and available at tokens store', async () => {
    // Given

    const { setBothAddrs, tokenValues, completeWeiPair } = usePairInput()

    // When

    setBothAddrs(buildPair((type) => TOKENS[type].address))
    tokenValues.tokenA = '1.234' as WeiAsToken
    tokenValues.tokenB = '8005' as WeiAsToken

    // Then

    expect(completeWeiPair.value).toMatchInlineSnapshot(`
      {
        "tokenA": {
          "address": "0xb9920BD871e39C6EF46169c32e7AC4C698688881",
          "wei": "1234000000000000000",
        },
        "tokenB": {
          "address": "0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a",
          "wei": "800500000000000000000000",
        },
      }
    `)
  })

  test('`completeWeiPair` is null when some token is not set', () => {
    // Given

    const { setBothAddrs, tokenValues, completeWeiPair } = usePairInput()

    // When

    setBothAddrs(buildPair((type) => TOKENS[type].address))
    tokenValues.tokenB = '8005' as WeiAsToken

    // Then

    expect(completeWeiPair.value).toBeNull()
  })

  test('`completeWeiPair` is null when some token is 0', () => {
    // Given

    const { setBothAddrs, tokenValues, completeWeiPair } = usePairInput()

    // When

    setBothAddrs(buildPair((type) => TOKENS[type].address))
    tokenValues.tokenA = '0' as WeiAsToken
    tokenValues.tokenB = '8005' as WeiAsToken

    // Then

    expect(completeWeiPair.value).toBeNull()
  })
})

describe('useEstimatedLayer()', () => {
  test('when initialized, `estimatedFor` is null', () => {
    const { estimatedFor } = useEstimatedLayer({ tokenValues: emptyTokenPair() })

    expect(estimatedFor.value).toBeNull()
  })

  test('when main token is set, token value is updated', () => {
    const tokenValues = emptyTokenPair()
    const { setMainToken } = useEstimatedLayer({ tokenValues })

    setMainToken('tokenA', '1234' as WeiAsToken)

    expect(tokenValues).toMatchInlineSnapshot(`
      {
        "tokenA": "1234",
        "tokenB": null,
      }
    `)
  })

  test('when main token is set, estimated type is set to another token', () => {
    const { setMainToken, estimatedFor } = useEstimatedLayer({ tokenValues: emptyTokenPair() })

    setMainToken('tokenA', '1234' as WeiAsToken)

    expect(estimatedFor.value).toBe('tokenB')
  })

  test('when estimated value is set, values are updated', () => {
    const tokenValues = emptyTokenPair()
    const { setMainToken, setEstimated } = useEstimatedLayer({ tokenValues })

    setMainToken('tokenA', '1234' as WeiAsToken)
    setEstimated('4321' as WeiAsToken)

    expect(tokenValues).toMatchInlineSnapshot(`
      {
        "tokenA": "1234",
        "tokenB": "4321",
      }
    `)
  })

  test('when estimated value is set, estimated is marked as up-to-date', () => {
    const tokenValues = emptyTokenPair()
    const { setMainToken, setEstimated, isEstimatedUpToDate } = useEstimatedLayer({ tokenValues })

    expect(isEstimatedUpToDate.value).toBe(false)

    setMainToken('tokenA', '1234' as WeiAsToken)
    expect(isEstimatedUpToDate.value).toBe(false)

    setEstimated('4321' as WeiAsToken)
    expect(isEstimatedUpToDate.value).toBe(true)
  })

  test('when estimated value is set, and then main token value is updated, istimated is marked as out-of-date', () => {
    const tokenValues = emptyTokenPair()
    const { setMainToken, setEstimated, isEstimatedUpToDate } = useEstimatedLayer({ tokenValues })

    setMainToken('tokenA', '1234' as WeiAsToken)
    setEstimated('4321' as WeiAsToken)
    expect(isEstimatedUpToDate.value).toBe(true)

    setMainToken('tokenA', '1233' as WeiAsToken)
    expect(isEstimatedUpToDate.value).toBe(false)
  })

  test('when main token is not set, then estimated value setting throws the error', () => {
    const { setEstimated } = useEstimatedLayer({ tokenValues: emptyTokenPair() })

    expect(() => setEstimated('412' as WeiAsToken)).toThrowError()
  })

  test('when main token value is set to 0, then other token is set to 0 too', () => {
    const tokenValues = emptyTokenPair()
    const { setMainToken, setEstimated, estimatedFor } = useEstimatedLayer({ tokenValues })

    setMainToken('tokenB', '442' as WeiAsToken)
    setEstimated('55' as WeiAsToken)

    expect(tokenValues).toMatchInlineSnapshot(`
      {
        "tokenA": "55",
        "tokenB": "442",
      }
    `)

    setMainToken('tokenB', '0' as WeiAsToken)

    expect(tokenValues).toMatchInlineSnapshot(`
      {
        "tokenA": "0",
        "tokenB": "0",
      }
    `)
    expect(estimatedFor.value).toBeNull()
  })
})
