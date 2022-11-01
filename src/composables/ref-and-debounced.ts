import { Ref } from 'vue'

export function refAndDebounced<T>(instant: Ref<T>, debounce: number): { instant: Ref<T>; debounced: Ref<T> } {
  const debounced = shallowRef(instant.value)

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
