import { ComposedKey, FalsyScopeKey } from '@vue-kakuyaku/core'
import { Ref } from 'vue'

export function useControlledComposedKey<T extends ComposedKey<any, any>>(
  unfilteredKey: Ref<FalsyScopeKey | T>,
): { filteredKey: Ref<FalsyScopeKey | T>; setActive: (value: boolean) => void } {
  const [active, setActive] = useToggle(false)

  watch(
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    () => unfilteredKey.value && unfilteredKey.value.key,
    () => setActive(false),
    {
      // without this, key could be recomputed and accepted by `useParamScope`
      // **before** this guard execution. This guard will execute anyway, but
      // the prepare supply task will be triggered and user might see a wallet notification
      // with approval, while app is not caring about it anymore
      flush: 'sync',
    },
  )

  const filtered = computed(() => active.value && unfilteredKey.value)

  return {
    filteredKey: filtered,
    setActive,
  }
}
