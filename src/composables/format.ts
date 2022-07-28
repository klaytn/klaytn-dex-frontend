import { Wei } from '@/core/kaikas'
import { MaybeRef } from '@vueuse/core'
import BigNumber from 'bignumber.js'
import { roundTo } from 'round-to'
import { Ref } from 'vue'

export function useFormattedPercent(
  value: MaybeRef<null | undefined | number>,
  precision: MaybeRef<number>,
): Ref<null | string> {
  return computed(() => {
    const num = unref(value)
    if (typeof num === 'number') {
      return `${roundTo(num * 100, unref(precision))}%`
    }
    return null
  })
}

export function useFormattedToken(
  value: MaybeRef<null | undefined | Wei>,
  decimals: MaybeRef<null | undefined | { decimals: number }>,
  round: MaybeRef<number>,
): Ref<null | string> {
  return computed(() => {
    const val = unref(value)
    const dec = unref(decimals)
    if (!val || !dec) return null
    const r = unref(round)
    const token = val.toToken(dec)
    return String(roundTo(Number(token), r))
  })
}
