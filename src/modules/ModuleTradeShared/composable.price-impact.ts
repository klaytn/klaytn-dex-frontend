import { TokenAmount, Price, Route } from '@/core/kaikas/entities'
import { computePriceImpact } from '@/utils/common'
import { MaybeRef } from '@vueuse/core'

export function usePriceImpact({
  route,
  inputAmount,
  outputAmount,
}: {
  route: MaybeRef<Route | null>
  inputAmount: MaybeRef<TokenAmount | null>
  outputAmount: MaybeRef<TokenAmount | null>
}) {
  return computed(() => {
    // unrefArgs() ?
    const args = {
      route: unref(route),
      inputAmount: unref(inputAmount),
      outputAmount: unref(outputAmount),
    }
    if (!args.route || !args.inputAmount || !args.outputAmount) return null
    const priceImpact = computePriceImpact(args.route.midPrice, args.inputAmount, args.outputAmount)
    return priceImpact
  })
}
