import { Wei } from '@/core'
import { buildPair, TokensPair } from '@/utils/pair'
import { Ref } from 'vue'

export type ValidationResult = { kind: 'ok' } | { kind: 'err'; err: ValidationError } | { kind: 'pending' }

export const ValidationError = {
  UnselectedTokens: 'unselected',
  RouteNotFound: 'route-not-found',
  InsufficientBalanceOfInputToken: 'insufficient-balance',
  WalletIsNotConnected: 'unconnected-wallet',
} as const

export type ValidationError = typeof ValidationError[keyof typeof ValidationError]

const resultOk = (): ValidationResult => ({ kind: 'ok' })
const resultErr = (err: ValidationError): ValidationResult => ({ kind: 'err', err })
const resultPending = (): ValidationResult => ({ kind: 'pending' })

interface ValidationProps {
  selected: TokensPair<boolean>
  tokenABalance: Ref<null | Wei>
  tokenAInput: Ref<null | Wei>
  trade: Ref<'empty' | 'exist' | 'pending'>
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
    if (!(selected.tokenA && selected.tokenB && tokenAInput.value)) return resultErr(ValidationError.UnselectedTokens)
    if (trade.value === 'pending') return resultPending()
    if (trade.value === 'empty') return resultErr(ValidationError.RouteNotFound)
    if (wallet.value === 'anonymous') return resultErr(ValidationError.WalletIsNotConnected)
    if (!tokenABalance.value) return resultPending()
    if (tokenABalance.value.asBigInt < tokenAInput.value.asBigInt)
      return resultErr(ValidationError.InsufficientBalanceOfInputToken)

    return resultOk()
  })
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  describe('swap validation', () => {
    test('When some token is not selected, "Select Token" returned', () => {
      const validation = useSwapValidation({
        selected: { tokenA: false, tokenB: true },
        tokenABalance: shallowRef(null),
        tokenAInput: shallowRef(null),
        trade: ref('empty'),
        wallet: ref('anonymous'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.UnselectedTokens))
    })

    test('When trade is empty, validation errors', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        tokenABalance: shallowRef(null),
        tokenAInput: shallowRef(new Wei(551)),
        trade: ref('empty'),
        wallet: ref('anonymous'),
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
        trade: ref('exist'),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultErr(ValidationError.InsufficientBalanceOfInputToken))
    })

    test("When wallet is connected and trade exists and tokens are selected but balance doesn't exist, validation is pending", () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        tokenABalance: shallowRef(null),
        tokenAInput: shallowRef(new Wei(4123)),
        trade: ref('exist'),
        wallet: ref('connected'),
      })

      expect(validation.value).toEqual(resultPending())
    })

    test('When tokens are selected and input token exists and trade too, but wallet is not connected, validation errors', () => {
      const validation = useSwapValidation({
        selected: buildPair(() => true),
        tokenABalance: shallowRef(null),
        tokenAInput: shallowRef(new Wei(42000000000)),
        trade: ref('exist'),
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
  })
}
