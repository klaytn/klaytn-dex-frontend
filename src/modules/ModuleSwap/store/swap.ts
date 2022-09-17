import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { Address, Wei, WeiAsToken } from '@/core'
import BigNumber from 'bignumber.js'
import { TokenType, TokensPair, mirrorTokenType, buildPair } from '@/utils/pair'
import Debug from 'debug'
import { useGetAmount, GetAmountProps } from '../composable.get-amount'
import { usePairAddress, usePairBalance, useSimplifiedResult } from '../../ModuleTradeShared/composable.pair-by-tokens'
import { useSwapValidation } from '../composable.validation'
import { buildSwapProps, TokenAddrAndWeiInput } from '../util.swap-props'
import {
  usePairInput,
  useEstimatedLayer,
  useLocalStorageAddrsOrigin,
} from '../../ModuleTradeShared/composable.pair-input'
import { Ref } from 'vue'
import { useRates } from '@/modules/ModuleTradeShared/composable.rates'
import { RouteName } from '@/types'
import { useControlledComposedKey } from '@/utils/composable.controlled-composed-key'

const debugModule = Debug('swap-store')

type NormalizedWeiInput = TokensPair<TokenAddrAndWeiInput> & { amountFor: TokenType }

function useSwap(input: Ref<null | NormalizedWeiInput>) {
  const dexStore = useDexStore()
  const tokensStore = useTokensStore()
  const { notify } = useNotify()

  const swapKey = computed(() => {
    if (!input.value) return null
    const { tokenA, tokenB, amountFor } = input.value
    return (
      dexStore.active.kind === 'named' && {
        key: `${tokenA.addr}-${tokenA.input}-${tokenB.addr}-${tokenB.input}-${amountFor}`,
        payload: { props: { tokenA, tokenB, amountFor }, dex: dexStore.active.dex() },
      }
    )
  })

  const { filteredKey, setActive } = useControlledComposedKey(swapKey)

  const scope = useParamScope(filteredKey, ({ props: { tokenA, tokenB, amountFor }, dex }) => {
    const { state: prepareState, run: prepare } = useTask(
      async () => {
        // 1. Approve amount of the tokenA
        await dex.agent.approveAmount(tokenA.addr, tokenA.input)

        // 2. Perform swap according to which token is "exact" and if
        // some of them is native
        const swapProps = buildSwapProps({ tokenA, tokenB, referenceToken: mirrorTokenType(amountFor) })
        const { send, fee } = await dex.swap.prepareSwap(swapProps)

        return { send, fee }
      },
      { immediate: true },
    )

    usePromiseLog(prepareState, 'prepare-swap')
    useNotifyOnError(prepareState, notify, 'Swap preparation failed')

    const { state: swapState, run: swap } = useTask(async () => {
      invariant(prepareState.fulfilled)
      const { send } = prepareState.fulfilled.value
      await send()
    })

    usePromiseLog(swapState, 'swap')
    wheneverFulfilled(swapState, () => {
      tokensStore.touchUserBalance()
    })
    useNotifyOnError(swapState, notify, 'Swap failed')

    return {
      prepare,
      swap,
      fee: computed(() => prepareState.fulfilled?.value.fee ?? null),
      prepareState: promiseStateToFlags(prepareState),
      swapState: promiseStateToFlags(swapState),
    }
  })

  return {
    prepare: () => {
      scope.value ? scope.value.expose.prepare() : setActive(true)
    },
    clear: () => setActive(false),
    swapFee: computed(() => scope.value?.expose.fee ?? null),
    prepareState: computed(() => scope.value?.expose.prepareState ?? null),
    swapState: computed(() => scope.value?.expose.swapState ?? null),
    swap: () => scope.value?.expose.swap(),
  }
}

export const useSwapStore = defineStore('swap', () => {
  const route = useRoute()
  const isActiveRoute = computed(() => route.name === RouteName.Swap)

  // #region selection

  const selection = usePairInput({ addrsOrigin: useLocalStorageAddrsOrigin('swap-selection', isActiveRoute) })
  const { tokens, resetInput, tokenValues } = selection
  const addrsReadonly = readonly(selection.addrs)

  const symbols = computed(() => buildPair((type) => tokens[type]?.symbol ?? null))

  function setTokenAddress(type: TokenType, addr: Address | null) {
    selection.addrs[type] = addr
  }

  function setBothTokens(pair: TokensPair<Address | null>) {
    selection.setBothAddrs(pair)
    selection.resetInput()
  }

  // #endregion

  // #region Pair data

  const { pair: pairAddrResult } = usePairAddress(addrsReadonly)
  const { result: pairBalance } = usePairBalance(
    addrsReadonly,
    computed(() => pairAddrResult.value?.kind === 'exist'),
  )
  const poolShare = computed(() => pairBalance.value?.poolShare ?? null)
  const formattedPoolShare = useFormattedPercent(poolShare, 7)

  // #endregion

  // #region estimated

  const { estimatedFor, setEstimated, setMainToken } = useEstimatedLayer(selection)

  // #endregion

  // #region Amounts

  const { gotAmountFor, gettingAmountFor } = useGetAmount(
    computed<GetAmountProps | null>(() => {
      const amountFor = estimatedFor.value
      if (!amountFor) return null

      const amountFrom = mirrorTokenType(amountFor)
      const referenceValue = selection.weiFromTokens[amountFrom]
      if (!referenceValue?.asBigInt) return null

      const { tokenA, tokenB } = addrsReadonly
      if (!tokenA || !tokenB) return null

      if (pairAddrResult.value?.kind !== 'exist') return null

      return {
        tokenA,
        tokenB,
        amountFor,
        referenceValue: referenceValue,
      }
    }),
  )

  watch(
    [gotAmountFor, selection.tokens],
    ([result]) => {
      if (result) {
        const {
          props: { amountFor },
          amount,
        } = result
        const tokenData = selection.tokens[amountFor]
        if (tokenData) {
          debugModule('Setting computed amount %o for %o', amount, amountFor)
          const raw = amount.toToken(tokenData)
          setEstimated(new BigNumber(raw).toFixed(5) as WeiAsToken)
        }
      }
    },
    { deep: true },
  )

  const estimatedForAfterAmountsComputation = computed<null | TokenType>(() => {
    return gotAmountFor.value?.props.amountFor ?? null
  })

  // #endregion

  // #region Action

  const normalizedWeiInputs = computed<NormalizedWeiInput | null>(() => {
    if (gotAmountFor.value) {
      const {
        amount,
        props: { amountFor, referenceValue, ...addrs },
      } = gotAmountFor.value
      return {
        ...buildPair((type) => ({ addr: addrs[type], input: amountFor === type ? amount : referenceValue })),
        amountFor,
      }
    }
    return null
  })

  const finalRates = useRates(
    computed(() => {
      const wei = normalizedWeiInputs.value
      if (!wei) return null
      return buildPair((type) => wei[type].input)
    }),
  )

  const { prepare, prepareState, swapState, swapFee, swap, clear: clearSwap } = useSwap(normalizedWeiInputs)

  // #endregion

  // #region validation

  const swapValidation = useSwapValidation({
    tokenA: computed(() => {
      const balance = selection.balance.tokenA as Wei | null
      const token = selection.tokens.tokenA
      const input = normalizedWeiInputs.value?.tokenA?.input

      return balance && token && input ? { ...token, balance, input } : null
    }),
    tokenB: computed(() => selection.tokens.tokenB),
    pairAddr: useSimplifiedResult(pairAddrResult),
  })

  const isValid = computed(() => swapValidation.value.kind === 'ok')
  const validationMessage = computed(() => (swapValidation.value.kind === 'err' ? swapValidation.value.message : null))

  // #endregion

  return {
    tokenValues: readonly(tokenValues),
    finalRates,
    addrs: addrsReadonly,
    normalizedWeiInputs,
    tokens,
    symbols,
    formattedPoolShare,

    isValid,
    validationMessage,

    swap,
    swapState,
    prepareState,
    prepare,
    swapFee,
    gettingAmountFor,
    gotAmountFor,
    clearSwap,
    estimatedFor: estimatedForAfterAmountsComputation,

    setTokenAddress,
    setToken: setMainToken,
    setBothTokens,
    resetInput,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
