import { acceptHMRUpdate, defineStore } from 'pinia'
import { Sorting } from '../types'

export const useFarmingStore = defineStore('farming', () => {
  const stakedOnly = ref(false)
  const searchQuery = ref('')
  const sorting = ref<Sorting>(Sorting.Default)

  function setFilterByPairName(name: string) {
    searchQuery.value = name
  }

  return {
    stakedOnly,
    searchQuery,
    sorting,
    setFilterByPairName,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useFarmingStore, import.meta.hot))
