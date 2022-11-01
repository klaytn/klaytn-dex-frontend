import { acceptHMRUpdate, defineStore } from 'pinia'
import { Sorting } from '../types'

export const useStakingStore = defineStore('staking', () => {
  const stateFactory = () => ({ stakedOnly: false, searchQuery: '', sorting: Sorting.Hot as Sorting })

  const state = ref(stateFactory())

  function reset() {
    state.value = stateFactory()
  }

  return { ...toRefs(toReactive(state)), reset }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useStakingStore, import.meta.hot))
