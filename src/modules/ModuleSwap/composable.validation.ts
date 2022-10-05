import { Wei } from '@/core'
import { BestTradeResult } from '@/core/entities/Trade'
import { buildPair, TokensPair } from '@/utils/pair'
import { Ref } from 'vue'

export type ValidationResult = { kind: 'ok' } | { kind: 'err'; err: ValidationError } | { kind: 'pending' }

export const ValidationError = {
  UnselectedTokens: 'unselected',
  RouteNotFound: 'route-not-found',
  InsufficientBalanceOfInputToken: 'insufficient-balance',
  WalletIsNotConnected: 'unconnected-wallet',
  PriceImpactIsTooHigh: 'high-price-impact',
} as const

export type ValidationError = typeof ValidationError[keyof typeof ValidationError]

const resultOk = (): ValidationResult => ({ kind: 'ok' })
const resultErr = (err: ValidationError): ValidationResult => ({ kind: 'err', err })
const resultPending = (): ValidationResult => ({ kind: 'pending' })

interface ValidationProps {
  selected: TokensPair<boolean>
  tokenABalance: Ref<null | Wei>
  tokenAInput: Ref<null | Wei>
  trade: Ref<BestTradeResult['kind'] | 'pending'>
  wallet: Ref<'anonymous' | 'connected'>
}

export function useSwapValidation({
  selected,
  tokenABalance,
  tokenAInput,
  trade,
  wallet,
}: ValidationProps): Ref<ValidationResult> {
  return computed(() => {
    if (wallet.value === 'anonymous') return resultErr(ValidationError.WalletIsNotConnected)
    if (!(selected.tokenA && selected.tokenB && (tokenAInput.value?.asBigInt ?? 0n) > 0n))
      return resultErr(ValidationError.UnselectedTokens)
    if (trade.value === 'pending') return resultPending()
    if (trade.value === 'route-not-found') return resultErr(ValidationError.RouteNotFound)
    if (trade.value === 'price-impact-is-too-high') return resultErr(ValidationError.PriceImpactIsTooHigh)
    if (!tokenABalance.value) return resultPending()
    if (tokenABalance.value.asBigInt < tokenAInput.value!.asBigInt)
      return resultErr(ValidationError.InsufficientBalanceOfInputToken)

    return resultOk()
  })
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  describe('swap validation', () => {
    test('When wallet is not connected, "Not Connected" returned', () => {
      const validation = useSwapValidation({
        selected: { tokenA: false, tokenB: true },
        tokenABalance: shallowRef(null),
        tokenAInput: shallowRef(null),
        trade: ref('route-not-found'),
        wallet: ref('anonymous'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.WalletIsNotConnected))
    })

    test('When trade is empty, validation errors', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        tokenABalance: shallowRef(null),
        tokenAInput: shallowRef(new Wei(551)),
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
        tokenABalance: shallowRef(BALANCE),
        tokenAInput: shallowRef(INPUT),
        trade: ref('ok'),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.InsufficientBalanceOfInputToken))
    })

    test("When wallet is connected and trade exists and tokens are selected but balance doesn't exist, validation is pending", () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        tokenABalance: shallowRef(null),
        tokenAInput: shallowRef(new Wei(4123)),
        trade: ref('ok'),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultPending())
    })

    test('When tokens are selected and input token exists and trade too, but wallet is not connected, validation errors', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        tokenABalance: shallowRef(null),
        tokenAInput: shallowRef(new Wei(42000000000)),
        trade: ref('ok'),
        wallet: ref('anonymous'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.WalletIsNotConnected))
    })

    test('when tokens are selected, but input value is not yet, then validation fails', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        tokenABalance: shallowRef(null),
        tokenAInput: shallowRef(null),
        trade: ref('pending'),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.UnselectedTokens))
    })

    test('When tokens are selected and input token exists, but price impact is too hight, validation fails', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        tokenABalance: shallowRef(null),
        tokenAInput: shallowRef(new Wei(42000000000)),
        trade: ref('price-impact-is-too-high'),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.PriceImpactIsTooHigh))
    })

    test('When tokenA value exists, but it is 0, then validation fails to "Select tokens"', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        tokenABalance: shallowRef(null),
        tokenAInput: shallowRef(new Wei(0)),
        trade: ref('pending'),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.UnselectedTokens))
    })
  })
}
