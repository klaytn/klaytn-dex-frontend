import { Address } from '@/core/kaikas'
import { TokensPair } from '@/utils/pair'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { Sorting } from '../types'

export const useFarmingStore = defineStore('farming', () => {
  const stakedOnly = ref(false)
  const searchQuery = ref('')
  const sorting = ref<Sorting>(Sorting.Default)

  const openPoolsFor = ref<null | TokensPair<Address>>(null)

  function setOpenPoolsFor(tokens: TokensPair<Address>) {
    openPoolsFor.value = tokens
  }

  return { stakedOnly, searchQuery, sorting, openPoolsFor, setOpenPoolsFor }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
