import { Wei } from '@/core'
import { BestTradeResult } from '@/core/entities/Trade'
import { TokensPair, buildPair, emptyPair } from '@/utils/pair'
import { Ref } from 'vue'

export type ValidationResult = { kind: 'ok' } | { kind: 'err'; err: ValidationError } | { kind: 'pending' }

export const ValidationError = {
  UnselectedTokens: 'unselected',
  RouteNotFound: 'route-not-found',
  InsufficientBalanceOfInputToken: 'insufficient-balance',
  WalletIsNotConnected: 'unconnected-wallet',
  PriceImpactIsTooHigh: 'high-price-impact',
  JustNotReady: 'just-not-ready',
} as const

export type ValidationError = typeof ValidationError[keyof typeof ValidationError]

const resultOk = (): ValidationResult => ({ kind: 'ok' })
const resultErr = (err: ValidationError): ValidationResult => ({ kind: 'err', err })
const resultPending = (): ValidationResult => ({ kind: 'pending' })

interface ValidationProps {
  selected: TokensPair<boolean>
  amounts: TokensPair<null | Wei>
  tokenABalance: Ref<null | Wei>
  trade: Ref<null | BestTradeResult['kind'] | 'pending'>
  wallet: Ref<'anonymous' | 'connected'>
}

export function useSwapValidation({
  selected,
  amounts,
  tokenABalance,
  trade,
  wallet,
}: ValidationProps): Ref<ValidationResult> {
  return computed(() => {
    if (wallet.value === 'anonymous') return resultErr(ValidationError.WalletIsNotConnected)

    if (trade.value) {
      if (trade.value === 'pending') return resultPending()
      if (trade.value === 'route-not-found') return resultErr(ValidationError.RouteNotFound)
      if (trade.value === 'price-impact-is-too-high') return resultErr(ValidationError.PriceImpactIsTooHigh)
    }

    if (!(selected.tokenA && selected.tokenB && (amounts.tokenA?.asBigInt ?? amounts.tokenB?.asBigInt ?? 0n) > 0n))
      return resultErr(ValidationError.UnselectedTokens)

    if (!tokenABalance.value) return resultPending()

    if (amounts.tokenA && amounts.tokenA.asBigInt > tokenABalance.value.asBigInt)
      return resultErr(ValidationError.InsufficientBalanceOfInputToken)

    if (!amounts.tokenA || !amounts.tokenB) return resultErr(ValidationError.JustNotReady)

    return resultOk()
  })
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  describe('swap validation', () => {
    test('When wallet is not connected, "Not Connected" returned', () => {
      const validation = useSwapValidation({
        selected: { tokenA: false, tokenB: true },
        amounts: emptyPair(),
        tokenABalance: shallowRef(null),
        trade: ref('route-not-found'),
        wallet: ref('anonymous'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.WalletIsNotConnected))
    })

    test('When trade is empty, but amounts exists, validation errors', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        amounts: { tokenA: new Wei(441), tokenB: new Wei(1) },
        tokenABalance: shallowRef(null),
        trade: ref('route-not-found'),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.RouteNotFound))
    })

    test('When tokenA balance is insufficient, validation fails', () => {
      const INPUT = new Wei(1001)
      const BALANCE = new Wei(1000)

      const validation = useSwapValidation({
        selected: buildPair(() => true),
        amounts: { tokenA: INPUT, tokenB: new Wei(1) },
        tokenABalance: shallowRef(BALANCE),
        trade: ref('ok'),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.InsufficientBalanceOfInputToken))
    })

    test("When wallet is connected and trade exists and tokens are selected but balance doesn't exist, validation is pending", () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        amounts: { tokenA: new Wei(4123), tokenB: new Wei(1) },
        tokenABalance: shallowRef(null),
        trade: ref('ok'),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultPending())
    })

    test('When tokens are selected and input token exists and trade too, but wallet is not connected, validation errors', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        amounts: buildPair(() => new Wei(42)),
        tokenABalance: shallowRef(null),
        trade: ref('ok'),
        wallet: ref('anonymous'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.WalletIsNotConnected))
    })

    test('when tokens are selected, but input value is not yet, then validation fails', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        amounts: { tokenA: null, tokenB: null },
        tokenABalance: shallowRef(null),
        trade: ref(null),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.UnselectedTokens))
    })

    test('When tokens are selected and input token exists, but price impact is too hight, validation fails', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        amounts: buildPair(() => new Wei(40)),
        tokenABalance: shallowRef(null),
        trade: ref('price-impact-is-too-high'),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.PriceImpactIsTooHigh))
    })

    test('When tokenA value exists, but it is 0, then validation fails to "Select tokens"', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        amounts: { tokenA: new Wei(0), tokenB: null },
        tokenABalance: shallowRef(null),
        trade: ref(null),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.UnselectedTokens))
    })

    test('When route is not found and some of tokens have 0 values, then "route not found" error is returned', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        amounts: { tokenA: new Wei(0), tokenB: null },
        tokenABalance: shallowRef(null),
        trade: ref('route-not-found'),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.RouteNotFound))
    })

    test('When tokens are selected and tokenA balance is known, but there is no value of tokenA, then WHAT?', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        amounts: { tokenA: null, tokenB: new Wei(4) },
        tokenABalance: shallowRef(new Wei(100)),
        trade: ref(null),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.JustNotReady))
    })
  })
}
