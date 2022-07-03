import { acceptHMRUpdate, defineStore } from 'pinia'
import { Status } from '@soramitsu-ui/ui'
import type { AbiItem } from 'caver-js'
import { abi as KIP7_ABI_RAW } from '@/core/kaikas/smartcontracts/kip-7.json'
import invariant from 'tiny-invariant'
import { useTask, wheneverTaskErrors, wheneverTaskSucceeds } from '@vue-kakuyaku/core'
import { isNativeToken } from '@/core/kaikas'

const KIP7_ABI = KIP7_ABI_RAW as AbiItem[]

interface State {
  exchangeRateLoading: boolean
  pairNotExist: boolean
  slippagePercent: number
  exchangeRateIntervalID: ReturnType<typeof setInterval> | null
}

const stateFactory = function (): State {
  return {
    exchangeRateLoading: false,
    pairNotExist: false,
    slippagePercent: 0.5,
    exchangeRateIntervalID: null,
  }
}

export const useSwapStore = defineStore('swap', () => {
  const kaikasStore = useKaikasStore()
  const tokensStore = useTokensStore()

  const state = reactive(stateFactory())

  async function getAmount(value: string, mode: 'in' | 'out') {
    const kaikas = kaikasStore.getKaikasAnyway()
    const { tokenA, tokenB } = tokensStore.getSelectedTokensAnyway()

    const amounts =
      mode === 'out'
        ? await kaikas.swap.getAmountOut(tokenA.address, tokenB.address, value)
        : await kaikas.swap.getAmountIn(tokenA.address, tokenB.address, value)

    const { pairBalance, userBalance } = await kaikas.tokens.getPairBalance(tokenA.address, tokenB.address)

    tokensStore.setTokenValue(
      mode === 'out'
        ? { type: 'tokenB', value: amounts[1], pairBalance, userBalance }
        : { type: 'tokenA', value: amounts[0], pairBalance, userBalance },
    )
  }

  const swapExactTokensForTokensTask = useTask(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    const { tokenA, tokenB } = tokensStore.getSelectedTokensAnyway()
    invariant(tokenA.value && tokenB.value)

    await kaikas.cfg.approveAmount(tokenA.address, KIP7_ABI, tokenA.value)

    const { send } = await kaikas.swap.swapExactTokensForTokens({
      addressA: tokenA.address,
      addressB: tokenB.address,
      valueA: tokenA.value,
      valueB: tokenB.value,
    })
    await send()

    tokensStore.getTokens()
  })

  const swapTokensForExactTokensTask = useTask(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    const { tokenA, tokenB } = tokensStore.getSelectedTokensAnyway()
    invariant(tokenA.value && tokenB.value)

    await kaikas.cfg.approveAmount(tokenA.address, KIP7_ABI, tokenA.value)

    const { send } = await kaikas.swap.swapExactTokensForTokens({
      addressA: tokenA.address,
      addressB: tokenB.address,
      valueA: tokenA.value,
      valueB: tokenB.value,
    })
    await send()

    tokensStore.getTokens()
  })

  const swapForKlayTokensTask = useTask(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()

    const { computedToken, selectedTokens } = tokensStore.state
    invariant(computedToken)

    const selectedToken = selectedTokens[computedToken]
    const inputToken = selectedTokens[computedToken === 'tokenA' ? 'tokenB' : 'tokenA']
    invariant(selectedToken?.value && inputToken?.value)

    const { tokenA } = tokensStore.getSelectedTokensAnyway()
    invariant(tokenA.value)

    const isComputedNativeToken = isNativeToken(selectedToken.address)

    await kaikas.cfg.approveAmount(tokenA.address, KIP7_ABI, tokenA.value)

    const exactTokensForEth = computedToken === 'tokenB' && isComputedNativeToken
    const exactETHForTokens = computedToken === 'tokenB' && !isComputedNativeToken
    const ETHForExactTokens = computedToken === 'tokenA' && isComputedNativeToken
    const tokensForExactETH = computedToken === 'tokenA' && !isComputedNativeToken

    if (exactTokensForEth) {
      const { send } = await kaikas.swap.swapExactTokensForETH({
        addressA: selectedToken.address,
        addressB: inputToken.address,
        valueA: selectedToken.value,
        valueB: inputToken.value,
      })
      await send()
    }

    if (exactETHForTokens) {
      const { send } = await kaikas.swap.swapExactETHForTokens({
        addressA: selectedToken.address,
        valueA: selectedToken.value,
        addressB: inputToken.address,
        valueB: inputToken.value,
      })
      await send()
    }

    if (ETHForExactTokens) {
      const { send } = await kaikas.swap.swapEthForExactTokens({
        to: selectedToken.address,
        from: inputToken.address,
        amountOut: selectedToken.value,
        amountIn: inputToken.value,
      })
      await send()
    }

    if (tokensForExactETH) {
      const { send } = await kaikas.swap.swapTokensForExactETH({
        to: inputToken.address,
        from: selectedToken.address,
        amountOut: inputToken.value,
        amountInMax: selectedToken.value,
      })
      await send()
    }
  })

  for (const swapTask of [swapExactTokensForTokensTask, swapTokensForExactTokensTask, swapForKlayTokensTask]) {
    wheneverTaskSucceeds(swapTask, () => {
      $notify({ status: Status.Success, description: 'Swap success' })
    })
    wheneverTaskErrors(swapTask, (err) => {
      $notify({ status: Status.Error, description: `Swap failed: ${String(err)}` })
    })
  }

  function setSlippage(value: number) {
    state.slippagePercent = value
  }

  function setExchangeRateIntervalID(intervalID: ReturnType<typeof setInterval> | null) {
    state.exchangeRateIntervalID = intervalID
  }

  return {
    state,
    getAmount,
    swapExactTokensForTokensTask,
    swapForKlayTokensTask,
    swapTokensForExactTokensTask,
    setSlippage,
    setExchangeRateIntervalID,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
