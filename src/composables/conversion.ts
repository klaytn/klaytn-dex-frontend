import { tokenRawToWei, tokenWeiToRaw, ValueWei } from '@/core/kaikas'
import { MaybeRef } from '@vueuse/core'
import { Ref } from 'vue'

// FIXME untested
export function useWei(wei: Ref<ValueWei<string>>, decimals: MaybeRef<number>): Ref<string> {
  const converted = ref<string>() as Ref<string>

  const sourceAsConverted = computed(() => tokenWeiToRaw({ decimals: unref(decimals) }, wei.value))
  watch(
    sourceAsConverted,
    (value) => {
      converted.value = value
    },
    { immediate: true, flush: 'sync' },
  )

  const convertedAsWei = computed(() => {
    const value = converted.value
    if (!value || Number.isNaN(Number(value))) return null
    return tokenRawToWei({ decimals: unref(decimals) }, value)
  })
  watch(
    convertedAsWei,
    (value: null | ValueWei<string>) => {
      if (value && value !== wei.value) {
        wei.value = value
      }
    },
    { flush: 'sync' },
  )

  return converted
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest

  const weiRef = (value: string) => ref(value as ValueWei<string>)

  test('conversion to raw is ok', () => {
    const wei = weiRef('414000')

    const converted = useWei(wei, 4)

    expect(converted.value).toEqual('41.4')
  })

  test('converted value writes to wei back', () => {
    const wei = weiRef('123000')
    const converted = useWei(wei, 4)

    converted.value = '1.5'

    expect(wei.value).toEqual('15000')
  })
}
