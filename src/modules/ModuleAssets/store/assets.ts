import { Address } from '@/core'
import { isAddress } from '@ethersproject/address'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useAssetsStore = defineStore('assets', () => {
  const hiddenAssets = useLocalStorage<Set<Address>>('assets-hidden-tokens', new Set(), {
    serializer: {
      read: (raw) => {
        const parsed = JSON.parse(raw)

        return new Set(Array.isArray(parsed) ? parsed.filter((x) => isAddress(x)) : [])
      },
      write: (set) => JSON.stringify(set.values()),
    },
  })

  function toggleHidden(token: Address, hidden: boolean) {
    hidden ? hiddenAssets.value.add(token) : hiddenAssets.value.delete(token)
  }

  const tokensStore = useTokensStore()

  const tokensFilteredByHidden = computed(() => {
    const items = tokensStore.tokensLoaded
    return items.filter((x) => !hiddenAssets.value.has(x.address))
  })

  return {
    toggleHidden,
    tokensFilteredByHidden,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useAssetsStore, import.meta.hot))
