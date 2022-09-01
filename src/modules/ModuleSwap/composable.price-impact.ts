import { TokenAmount, Route } from '@/core'
import { computePriceImpact } from '@/utils/common'
import { MaybeRef } from '@vueuse/core'

interface Props {
  route: MaybeRef<Route | null>
  inputAmount: MaybeRef<TokenAmount | null>
  outputAmount: MaybeRef<TokenAmount | null>
}

export function usePriceImpact(props: Props) {
  return computed(() => {
    // unrefProps() ?
    const route = unref(props.route)
    const inputAmount = unref(props.inputAmount)
    const outputAmount = unref(props.outputAmount)
    if (!route || !inputAmount || !outputAmount) return null
    const priceImpact = computePriceImpact(route.midPrice, inputAmount, outputAmount)
    return priceImpact
  })
}
