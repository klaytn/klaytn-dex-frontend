import { TokenAmount } from '@/core'
import { computeRates, roundRates } from '@/utils/common'
import { TokensPair } from '@/utils/pair'
import { MaybeRef } from '@vueuse/core'

export function useRates(amounts: MaybeRef<null | TokensPair<TokenAmount>>) {
  return computed(() => {
    const { tokenA, tokenB } = unref(amounts) || {}
    if (!tokenB || !tokenA) return null
    const rates = computeRates({ tokenA, tokenB })
    return roundRates(rates)
  })
}
