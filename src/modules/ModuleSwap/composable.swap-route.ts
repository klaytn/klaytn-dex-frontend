import { TokenImpl, TokenAmount, Route, Pair, Wei } from '@/core'
import { TokenType } from '@/utils/pair'
import { MaybeRef } from '@vueuse/core'
import { ComputedRef } from 'vue'

interface SwapRouteProps {
  pairs: MaybeRef<Pair[] | null>
  inputToken: MaybeRef<TokenImpl | null>
  outputToken: MaybeRef<TokenImpl | null>
  amountInWei: MaybeRef<Wei | null>
  amountFor: MaybeRef<TokenType | null>
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
    const inputToken = unref(props.inputToken)
    const outputToken = unref(props.outputToken)
    const amountInWei = unref(props.amountInWei)
    const amountFor = unref(props.amountFor)

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
