import { acceptHMRUpdate, defineStore } from 'pinia'
import { Sorting } from '../types'

export const useStakingStore = defineStore('staking', () => {
  const stakedOnly = ref(false)
  const searchQuery = ref('')
  const sorting = ref<Sorting>(Sorting.Hot)

  return { stakedOnly, searchQuery, sorting }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useStakingStore, import.meta.hot))
