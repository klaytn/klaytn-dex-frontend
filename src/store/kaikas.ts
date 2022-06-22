import { acceptHMRUpdate, defineStore } from 'pinia'

export const useKaikasStore = defineStore('kaikas', {
  // arrow function recommended for full type inference
  state: () => {
    return {
      // all these properties will have their type inferred automatically
      address: null,
      isNotInstalled: typeof window?.klaytn === 'undefined',
    }
  },
  actions: {
    connectKaikas(address) {
      this.address = address
    },
  },
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useKaikasStore, import.meta.hot))
