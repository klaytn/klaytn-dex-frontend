// import { TokenAmount, Route } from '@/core'
// import { computePriceImpact } from '@/utils/common'
// import { TokensPair } from '@/utils/pair'
// import { MaybeRef } from '@vueuse/core'

// interface Props {
//   route: MaybeRef<Route | null>
//   amounts: MaybeRef<TokensPair<TokenAmount> | null>
// }

// export function usePriceImpact(props: Props) {
//   return computed(() => {
//     // unrefProps() ?
//     const route = unref(props.route)
//     const amounts = unref(props.amounts)
//     if (!route || !amounts) return null
//     const priceImpact = computePriceImpact(route.midPrice, amounts.tokenA, amounts.tokenB)
//     return priceImpact
//   })
// }
