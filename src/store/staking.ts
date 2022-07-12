import { acceptHMRUpdate, defineStore } from 'pinia'

import { Sorting } from '@/modules/StakingModule/types'

const { klaytn } = window

interface State {
  stakedOnly: boolean
  searchQuery: string
  sorting: Sorting
}

const state = function (): State {
  return {
    stakedOnly: false,
    searchQuery: '',
    sorting: Sorting.Default
  }
}

export const useStakingStore = defineStore('staking', {
  state,

  actions: {
    async addTokenToKaikas({ address, symbol, decimals, image }: { address: string, symbol: string, decimals: number, image?: string }) {

      klaytn.sendAsync(
        {
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address,
              symbol,
              decimals,
              image
            }
          },
          id: Math.round(Math.random() * 100000)
        }
      )
    }
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
