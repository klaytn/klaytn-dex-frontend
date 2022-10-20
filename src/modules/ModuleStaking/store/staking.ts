import { acceptHMRUpdate, defineStore } from 'pinia'
import { Sorting } from '../types'

export const useStakingStore = defineStore('staking', () => {
  const stakedOnly = ref(false)
  const searchQuery = ref('')
  const sorting = ref<Sorting>(Sorting.Hot)

  function resetFilter() {
    stakedOnly.value = false
    searchQuery.value = ''
    sorting.value = Sorting.Hot
  }

  return { stakedOnly, searchQuery, sorting, resetFilter }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useStakingStore, import.meta.hot))
