import { acceptHMRUpdate, defineStore } from 'pinia'
import { Sorting } from '../types'

export const useFarmingStore = defineStore('farming', () => {
  const stakedOnly = ref(false)
  const searchQuery = ref('')
  const sorting = ref<Sorting>(Sorting.Default)

  return { stakedOnly, searchQuery, sorting }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
