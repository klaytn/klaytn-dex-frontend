import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { Address, tokenWeiToRaw, ValueWei } from '@/core/kaikas'
import BigNumber from 'bignumber.js'
import { TokenType, TokensPair, buildPair, mirrorTokenType } from '@/utils/pair'
import Debug from 'debug'
import { useGetAmount, GetAmountProps } from '../composable.get-amount'
import { usePairAddress, useSimplifiedResult } from '../../ModuleTradeShared/composable.pair-by-tokens'
import { useSwapValidation } from '../composable.validation'
import { buildSwapProps } from '../util.swap-props'
import { useTokensInput } from '../../ModuleTradeShared/composable.tokens-input'

const debugModule = Debug('swap-store')

export const useSwapStore = defineStore('swap', () => {
  const kaikasStore = useKaikasStore()
  const tokensStore = useTokensStore()

  const selection = useTokensInput({ localStorageKey: 'swap-selection' })
  const addrsReadonly = readonly(selection.addrsWritable)

  const { pair: pairAddrResult } = toRefs(usePairAddress(addrsReadonly))

  const swapValidation = useSwapValidation({
    tokenA: computed(() => {
      const balance = selection.balance.tokenA as ValueWei<BigNumber> | null
      const token = selection.tokens.tokenA
      const input = selection.wei.tokenA?.input

      return balance && token && input ? { ...token, balance, input } : null
    }),
    tokenB: computed(() => selection.tokens.tokenB),
    pairAddr: useSimplifiedResult(pairAddrResult),
  })

  const isValid = computed(() => swapValidation.value.kind === 'ok')
  const validationMessage = computed(() => (swapValidation.value.kind === 'err' ? swapValidation.value.message : null))

  const getAmountFor = ref<null | TokenType>(null)

  const { gotAmountFor, gettingAmountFor } = useGetAmount(
    computed<GetAmountProps | null>(() => {
      const amountFor = getAmountFor.value
      if (!amountFor) return null

      const referenceValue = selection.wei[mirrorTokenType(amountFor)]
      if (!referenceValue || new BigNumber(referenceValue.input).isLessThanOrEqualTo(0)) return null

      const { tokenA, tokenB } = addrsReadonly
      if (!tokenA || !tokenB) return null

      if (pairAddrResult.value?.kind !== 'exist') return null

      return {
        tokenA,
        tokenB,
        amountFor,
        referenceValue: referenceValue.input,
      }
    }),
  )
  // const
  watch(
    [gotAmountFor, selection.tokens],
    ([result]) => {
      if (result) {
        const { type: amountFor, amount } = result
        const tokenData = selection.tokens[amountFor]
        if (tokenData) {
          debugModule('Setting computed amount %o for %o', amount, amountFor)
          const raw = tokenWeiToRaw(tokenData, amount)
          selection.input[amountFor].inputRaw = new BigNumber(raw).toFixed(5)
        }
      }
    },
    { deep: true },
  )

  function getSwapPrerequisitesAnyway() {
    const { tokenA, tokenB } = selection.wei
    invariant(tokenA && tokenB, 'Both tokens should be selected')

    const amountFor = getAmountFor.value
    invariant(amountFor, '"Amount for" should be set')

    return { tokenA, tokenB, amountFor }
  }

  const { state: swapState, run: swap } = useTask(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    const { tokenA, tokenB, amountFor } = getSwapPrerequisitesAnyway()

    // 1. Approve amount of the tokenA
    await kaikas.cfg.approveAmount(tokenA.addr, tokenA.input)

    // 2. Perform swap according to which token is "exact" and if
    // some of them is native
    const swapProps = buildSwapProps({ tokenA, tokenB, referenceToken: mirrorTokenType(amountFor) })
    const { send } = await kaikas.swap.swap(swapProps)

    // TODO confirm!
    await send()
  })
  wheneverFulfilled(swapState, () => {
    tokensStore.touchUserBalance()
  })
  useNotifyOnError(swapState, 'Swap failed')

  function setToken(type: TokenType, addr: Address | null) {
    selection.input[type] = { addr, inputRaw: '' }
  }

  function setBothTokens(pair: TokensPair<Address>) {
    selection.resetInput(buildPair((type) => ({ inputRaw: '', addr: pair[type] })))
    getAmountFor.value = null
  }

  function setTokenValue(type: TokenType, raw: string) {
    selection.input[type].inputRaw = raw
    getAmountFor.value = mirrorTokenType(type)
  }

  function reset() {
    selection.input.tokenA.addr = selection.input.tokenB.addr = getAmountFor.value = null
    selection.input.tokenA.inputRaw = selection.input.tokenB.inputRaw = ''
  }

  return {
    selection,

    isValid,
    validationMessage,

    swap,
    swapState,
    gettingAmountFor,
    gotAmountFor,

    setToken,
    setTokenValue,
    setBothTokens,
    reset,
  }
})

import.meta.hot?.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
