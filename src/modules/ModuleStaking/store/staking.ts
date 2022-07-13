import { acceptHMRUpdate, defineStore } from 'pinia'
import { Sorting } from '../types'
import { Address, TokenSymbol } from '@/core/kaikas'

export const useStakingStore = defineStore('staking', () => {
  const stakedOnly = ref(false)
  const searchQuery = ref('')
  const sorting = ref<Sorting>(Sorting.Default)

  const kaikasStore = useKaikasStore()

  function addTokenToKaikas({
    address,
    symbol,
    decimals,
    image,
  }: {
    address: Address
    symbol: TokenSymbol
    decimals: number
    image?: string
  }) {
    kaikasStore.getKaikasAnyway().cfg.klaytn.sendAsync({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address,
          symbol,
          decimals,
          image,
        },
      },
      id: Math.round(Math.random() * 100000),
    })
  }

  return { stakedOnly, searchQuery, sorting, addTokenToKaikas }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useStakingStore, import.meta.hot))
