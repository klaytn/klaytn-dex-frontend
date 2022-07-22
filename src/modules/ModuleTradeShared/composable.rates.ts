import { ValueWei } from '@/core/kaikas'
import { computeRates, roundRates } from '@/utils/common'
import { TokensPair } from '@/utils/pair'
import { MaybeRef } from '@vueuse/core'
import BN from 'bn.js'

export function useRates(amounts: MaybeRef<null | TokensPair<ValueWei<BN>>>) {
  return computed(() => {
    const { tokenA, tokenB } = unref(amounts) || {}
    if (!tokenB || !tokenA) return null
    const rates = computeRates({ tokenA, tokenB })
    return roundRates(rates)
  })
}
