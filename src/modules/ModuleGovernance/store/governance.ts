import { acceptHMRUpdate, defineStore } from 'pinia'
import { Sorting } from '../types'

export const useGovernanceStore = defineStore('governance', () => {
  const onlyActive = ref(false)
  const searchQuery = ref('')
  const sorting = ref<Sorting>(Sorting.StartDay)

  return { onlyActive, searchQuery, sorting }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useGovernanceStore, import.meta.hot))
