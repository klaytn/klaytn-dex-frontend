import { acceptHMRUpdate, defineStore } from 'pinia'

import { Status } from '@soramitsu-ui/ui'
import type { AbiItem } from 'caver-js'
import config from '@/utils/kaikas/config'
import kip7 from '@/utils/smartcontracts/kip-7.json'

interface State {
  exchangeRateLoading: boolean
  pairNotExist: boolean
  slippagePercent: number
  exchangeRateIntervalID: ReturnType<typeof setInterval> | null
}

const state = function (): State {
  return {
    exchangeRateLoading: false,
    pairNotExist: false,
    slippagePercent: 0.5,
    exchangeRateIntervalID: null,
  }
}

export const useSwapStore = defineStore('swap', {
  state,

  actions: {
    async getAmountOut(value: string) {
      const tokensStore = useTokensStore()
      const { tokenA, tokenB } = tokensStore.selectedTokens
      if (tokenA === null || tokenB === null)
        throw new Error('No selected tokens')

      const amountOut = await $kaikas.swap.getAmountOut(
        tokenA.address,
        tokenB.address,
        value,
      )

      const { pairBalance, userBalance }
        = await $kaikas.tokens.getPairBalance(tokenA.address, tokenB.address)

      tokensStore.setTokenValue({ type: 'tokenB', value: amountOut[1], pairBalance, userBalance })
    },

    async getAmountIn(value: string) {
      const tokensStore = useTokensStore()
      const { tokenA, tokenB } = tokensStore.selectedTokens
      if (tokenA === null || tokenB === null)
        throw new Error('No selected tokens')

      const amountIn = await $kaikas.swap.getAmountIn(
        tokenA.address,
        tokenB.address,
        value,
      )

      const { pairBalance, userBalance }
        = await $kaikas.tokens.getPairBalance(tokenA.address, tokenB.address)

      tokensStore.setTokenValue({ type: 'tokenA', value: amountIn[0], pairBalance, userBalance })
    },

    async swapExactTokensForTokens() {
      const tokensStore = useTokensStore()
      try {
        const { selectedTokens } = tokensStore
        const { tokenA, tokenB } = selectedTokens
        if (tokenA === null || tokenB === null)
          throw new Error('No selected tokens')

        await config.approveAmount(
          tokenA.address,
          kip7.abi as AbiItem[],
          tokenA.value,
        )

        const { send } = await $kaikas.swap.swapExactTokensForTokens({
          addressA: tokenA.address,
          addressB: tokenB.address,
          valueA: tokenA.value,
          valueB: tokenB.value,
        })

        await send()
        $notify({ status: Status.Success, description: 'Swap success' })
        tokensStore.getTokens()
      }
      catch (e) {
        $notify({ status: Status.Error, description: `${e}` })
      }
    },

    async swapTokensForExactTokens() {
      const tokensStore = useTokensStore()
      try {
        const { selectedTokens } = tokensStore
        const { tokenA, tokenB } = selectedTokens
        if (tokenA === null || tokenB === null)
          throw new Error('No selected tokens')

        await config.approveAmount(
          tokenA.address,
          kip7.abi as AbiItem[],
          tokenA.value,
        )

        const { send } = await $kaikas.swap.swapExactTokensForTokens({
          addressA: tokenA.address,
          addressB: tokenB.address,
          valueA: tokenA.value,
          valueB: tokenB.value,
        })

        await send()

        $notify({ status: Status.Success, description: 'Swap success' })

        tokensStore.getTokens()
      }
      catch (e) {
        $notify({ status: Status.Error, description: `${e}` })
      }
    },

    async swapForKlayTokens() {
      const tokensStore = useTokensStore()
      const { selectedTokens, computedToken } = tokensStore
      if (computedToken === null)
        throw new Error('No computed token')
      const { tokenA, tokenB } = selectedTokens

      const selectedToken = selectedTokens[computedToken]
      const inputToken = selectedTokens[computedToken === 'tokenA' ? 'tokenB' : 'tokenA']
      if (tokenA === null || tokenB === null || selectedToken === null || inputToken === null)
        throw new Error('No selected tokens')

      const isComputedNativeToken = $kaikas.utils.isNativeToken(
        selectedToken.address,
      )

      // await config.approveAmount(
      //   inputToken.address,
      //   kip7.abi,
      //   inputToken.value
      // );

      await config.approveAmount(
        tokenA.address,
        kip7.abi as AbiItem[],
        tokenA.value,
      )

      const exactTokensForEth
        = computedToken === 'tokenB' && isComputedNativeToken
      const exactETHForTokens
        = computedToken === 'tokenB' && !isComputedNativeToken
      const ETHForExactTokens
        = computedToken === 'tokenA' && isComputedNativeToken
      const tokensForExactETH
        = computedToken === 'tokenA' && !isComputedNativeToken

      if (exactTokensForEth) {
        const { send } = await $kaikas.swap.swapExactTokensForETH({
          addressA: selectedToken.address,
          addressB: inputToken.address,
          valueA: selectedToken.value,
          valueB: inputToken.value,
        })
        await send()
      }

      if (exactETHForTokens) {
        const { send } = await $kaikas.swap.swapExactETHForTokens({
          addressA: selectedToken.address,
          valueA: selectedToken.value,
          addressB: inputToken.address,
          valueB: inputToken.value,
        })
        await send()
      }

      if (ETHForExactTokens) {
        const { send } = await $kaikas.swap.swapEthForExactTokens({
          to: selectedToken.address,
          from: inputToken.address,
          amountOut: selectedToken.value,
          amountIn: inputToken.value,
        })
        await send()
      }

      if (tokensForExactETH) {
        const { send } = await $kaikas.swap.swapTokensForExactETH({
          to: inputToken.address,
          from: selectedToken.address,
          amountOut: inputToken.value,
          amountInMax: selectedToken.value,
        })
        await send()
      }

      $notify({ status: Status.Success, description: 'Swap success' })
    },

    refreshStore() {
      this.$state = state() // TODO: CHECK IT
    },

    setSlippage(value: number) {
      this.slippagePercent = value
    },

    setExchangeRateIntervalID(intervalID: ReturnType<typeof setInterval> | null) {
      this.exchangeRateIntervalID = intervalID
    },
  },
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
