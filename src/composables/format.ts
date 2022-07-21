import { MaybeRef } from '@vueuse/core'
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
