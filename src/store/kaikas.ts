import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Address } from '@/types'

interface State {
  address: Address | null
  isNotInstalled: boolean
}

export const useKaikasStore = defineStore('kaikas', {
  // arrow function recommended for full type inference
  state: (): State => {
    return {
      // all these properties will have their type inferred automatically
      address: null,
      isNotInstalled: typeof window?.klaytn === 'undefined',
    }
  },
  actions: {
    connectKaikas(address: Address) {
      this.address = address
    },
  },
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useKaikasStore, import.meta.hot))
