import { Ref } from 'vue'

export function refAndDebounced<T>(value: T, debounce: number): { instant: Ref<T>; debounced: Ref<T> } {
  const instant = shallowRef(value)
  const debounced = shallowRef(value)

  syncRef(instant, debounced, { direction: 'ltr' })

  watchDebounced(
    debounced,
    (val) => {
      instant.value = val
    },
    { debounce },
  )

  return { instant, debounced }
}
