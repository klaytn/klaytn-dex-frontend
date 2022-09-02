import { TokenImpl, TokenAmount, Route, Pair, Wei } from '@/core'
import { TokensPair, TokenType } from '@/utils/pair'
import { MaybeRef } from '@vueuse/core'
import { ComputedRef } from 'vue'

interface SwapRouteProps {
  tokens: TokensPair<TokenImpl | null>
  pairs: MaybeRef<Pair[] | null>
  amount: MaybeRef<{
    for: TokenType
    wei: Wei
  } | null>
}

export type SwapRouteResult =
  | {
      kind: 'empty'
    }
  | {
      kind: 'exist'
      route: Route
    }

export function useSwapRoute(props: SwapRouteProps): ComputedRef<SwapRouteResult | null> {
  return computed(() => {
    const pairs = unref(props.pairs)
    const { tokenA: inputToken, tokenB: outputToken } = props.tokens
    const { for: amountFor, wei: amountInWei } = unref(props.amount) ?? {}

    if (!pairs || !inputToken || !outputToken || !amountInWei || !amountFor) return null

    const amount = TokenAmount.fromWei(amountFor === 'tokenB' ? inputToken : outputToken, amountInWei)

    const route = Route.fromBestRate({
      pairs: pairs,
      inputToken: inputToken,
      outputToken: outputToken,
      amount,
    })

    if (!route) return { kind: 'empty' }

    return {
      route,
      kind: 'exist',
    }
  })
}
