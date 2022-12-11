import { ShallowRef } from 'vue'

export function computedEagerUsingWatch<T>(fn: () => T): ShallowRef<T> {
  const result = shallowRef()

  watch(
    fn,
    (value) => {
      result.value = value
    },
    { flush: 'sync' },
  )

  return result
}
