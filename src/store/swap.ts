import { acceptHMRUpdate, defineStore } from 'pinia'

import { Status } from '@soramitsu-ui/ui'
import config from '@/utils/kaikas/Config'
import kip7 from '@/utils/smartcontracts/kip-7.json'

const state = function () {
  return {
    exchangeRateLoading: null,
    pairNotExist: false,
    slippagePercent: 0.5,
    exchangeRateIntervalID: null,
  }
}

export const useSwapStore = defineStore('swap', {
  state,

  actions: {
    async getAmountOut(value) {
      const tokensStore = useTokensStore()
      const { tokenA, tokenB } = tokensStore.selectedTokens
      const amountOut = await $kaikas.swap.getAmountOut(
        tokenA.address,
        tokenB.address,
        value,
      )

      const { pairBalance, userBalance }
        = await $kaikas.tokens.getPairBalance(tokenA.address, tokenB.address)

      tokensStore.setTokenValue({ type: 'tokenB', value: amountOut[1], pairBalance, userBalance })
    },

    async getAmountIn(value) {
      const tokensStore = useTokensStore()
      const { tokenA, tokenB } = tokensStore.selectedTokens

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

        await config.approveAmount(
          selectedTokens.tokenA.address,
          kip7.abi,
          selectedTokens.tokenA.value,
        )

        const { send } = await $kaikas.swap.swapExactTokensForTokens({
          addressA: selectedTokens.tokenA.address,
          addressB: selectedTokens.tokenB.address,
          valueA: selectedTokens.tokenA.value,
          valueB: selectedTokens.tokenB.value,
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
        const { selectedTokens, computedToken } = tokensStore
        await config.approveAmount(
          selectedTokens.tokenA.address,
          kip7.abi,
          selectedTokens.tokenA.value,
        )

        const { send } = await $kaikas.swap.swapExactTokensForTokens({
          addressA: selectedTokens.tokenA.address,
          addressB: selectedTokens.tokenB.address,
          valueA: selectedTokens.tokenA.value,
          valueB: selectedTokens.tokenB.value,
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

      const isComputedNativeToken = $kaikas.utils.isNativeToken(
        selectedTokens[computedToken].address,
      )

      const inputToken
        = selectedTokens[computedToken === 'tokenA' ? 'tokenB' : 'tokenA']

      const computed = selectedTokens[computedToken]

      // await config.approveAmount(
      //   inputToken.address,
      //   kip7.abi,
      //   inputToken.value
      // );

      await config.approveAmount(
        selectedTokens.tokenA.address,
        kip7.abi,
        selectedTokens.tokenA.value,
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
          addressA: selectedTokens[computedToken].address,
          addressB: inputToken.address,
          valueA: selectedTokens[computedToken].value,
          valueB: inputToken.value,
        })
        await send()
      }

      if (exactETHForTokens) {
        const { send } = await $kaikas.swap.swapExactETHForTokens({
          addressA: selectedTokens[computedToken].address,
          valueA: selectedTokens[computedToken].value,
          addressB: inputToken.address,
          valueB: inputToken.value,
        })
        await send()
      }

      if (ETHForExactTokens) {
        const { send } = await $kaikas.swap.swapEthForExactTokens({
          to: computed.address,
          from: inputToken.address,
          amountOut: computed.value,
          amountIn: inputToken.value,
        })
        await send()
      }

      if (tokensForExactETH) {
        const { send } = await $kaikas.swap.swapTokensForExactETH({
          to: inputToken.address,
          from: computed.address,
          amountOut: inputToken.value,
          amountInMax: computed.value,
        })
        await send()
      }

      $notify({ status: Status.Success, description: 'Swap success' })
    },

    refreshStore() {
      this.$state = state() // TODO: CHECK IT
    },

    setSlippage(value) {
      this.slippagePercent = value
    },

    setExchangeRateIntervalID(intervalID) {
      this.exchangeRateIntervalID = intervalID
    },
  },
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
