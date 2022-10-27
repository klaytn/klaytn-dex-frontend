import { acceptHMRUpdate, defineStore } from 'pinia'
import { Sorting } from '../types'

export const useFarmingStore = defineStore('farming', () => {
  const stateFactory = () => ({ stakedOnly: false, searchQuery: '', sorting: Sorting.Hot as Sorting })

  const state = ref(stateFactory())

  function reset() {
    state.value = stateFactory()
  }

  function setFilterByPairName(name: string) {
    state.value.searchQuery = name
  }

  return {
    ...toRefs(toReactive(state)),
    reset,
    setFilterByPairName,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useFarmingStore, import.meta.hot))
