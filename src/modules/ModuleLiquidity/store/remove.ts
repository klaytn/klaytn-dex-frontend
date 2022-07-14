import { Address } from '@/core/kaikas'
import { TokensPair } from '@/utils/pair'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useLiquidityRmStore = defineStore('liquidity-remove', () => {
  function setTokens(tokens: TokensPair<Address>) {}

  return {
    setTokens,
  }
})

if (import.meta.hot) acceptHMRUpdate(useLiquidityRmStore, import.meta.hot)
