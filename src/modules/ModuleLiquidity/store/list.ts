import { acceptHMRUpdate, defineStore } from 'pinia'
import { POLL_INTERVAL_QUICK_TIMEOUT } from '../query.liquidity-pairs'

export const useLiquidityListStore = defineStore('liquidity-list', () => {
  const quickPoll = refAutoReset(false, POLL_INTERVAL_QUICK_TIMEOUT)

  return {
    quickPoll,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useLiquidityListStore, import.meta.hot))
