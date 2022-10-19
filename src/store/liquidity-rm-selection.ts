import type { Address } from '@/core'
import { JSON_SERIALIZER } from '@/utils/json-serializer'
import { TokensPair } from '@/utils/pair'
import { Serializer } from '@vueuse/core'
import { defineStore } from 'pinia'

/**
 * This store exists to be accessible within a router guard
 * `useLiquidityRmStore` is not accessible because it has dependencies to `dexStore`
 * and, in general, not implied to be used before dex initialization
 */
export const useLiquidityRmSelectionStore = defineStore('liquidity-remove-selection', () => {
  const [routeIsActive, setRouteIsActive] = useToggle(false)

  const selectedRaw = useLocalStorage<null | TokensPair<Address>>('liquidity-remove-tokens', null, {
    serializer: JSON_SERIALIZER as Serializer<any>,
  })

  const isThereSelectionStored = computed(() => !!selectedRaw.value)

  const selectedFiltered = computed(() => (routeIsActive.value ? unref(selectedRaw) : null))

  return { selected: selectedFiltered, selectedRaw, isThereSelectionStored, setRouteIsActive }
})
