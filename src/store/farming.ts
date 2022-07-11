import { acceptHMRUpdate, defineStore } from 'pinia'

import { Sorting } from '@/modules/FarmingModule/types'

interface State {
  stakedOnly: boolean
  searchQuery: string
  sorting: Sorting
}

const state = function (): State {
  return {
    stakedOnly: false,
    searchQuery: '',
    sorting: Sorting.Default,
  }
}

export const useFarmingStore = defineStore('farming', {
  state,
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
