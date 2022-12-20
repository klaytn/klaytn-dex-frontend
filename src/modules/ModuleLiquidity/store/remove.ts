import { Address, Token, TokenAmount, TokenImpl, Wei } from '@/core'
import {
  PairAddressResult,
  computeEstimatedPoolShare,
  useNullablePairBalanceComponents,
  usePairAddress,
  usePairBalance,
  usePairReserves,
} from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import { TOKEN_TYPES, TokensPair, buildPair, nonNullPair } from '@/utils/pair'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'
import { useRates } from '@/modules/ModuleTradeShared/composable.rates'
import { RouteName } from '@/types'
import { useControlledComposedKey } from '@/utils/composable.controlled-composed-key'
import { P, match } from 'ts-pattern'
import { useMinimalTokensApi } from '@/utils/minimal-tokens-api'
import { SlippagePercent, adjustDown } from '@/core/slippage'
import { DEFAULT_SLIPPAGE_TOLERANCE } from '../const'

function usePrepareSupply(props: {
  tokens: Ref<null | TokensPair<Address>>
  pairAddress: Ref<null | Address>
  liquidity: Ref<Wei | null>
  minAmounts: Ref<null | TokensPair<Wei>>
}) {
  const dexStore = useDexStore()
  const { notify } = useNotify()

  const scopeKey = computed(() => {
    const tokens = props.tokens.value
    const pair = props.pairAddress.value
    const liquidity = props.liquidity.value
    const minAmounts = props.minAmounts.value
    const activeDex = dexStore.active

    return (
      tokens &&
      pair &&
      liquidity &&
      minAmounts &&
      activeDex.kind === 'named' && {
        key:
          // `pair` also represents both `tokenA` + `tokenB`
          // `liquidity` also **should** strictly represent `amounts`
          `dex-${activeDex.wallet}-${pair}-${liquidity}`,
        payload: { tokens, pair, liquidity, minAmounts, dex: activeDex.dex() },
      }
    )
  })

  const { filteredKey, setActive } = useControlledComposedKey(scopeKey)

  const isReadyToPrepareSupply = computed(() => !!scopeKey.value)

  const liquidityListStore = useLiquidityListStore()

  const scope = useParamScope(
    filteredKey,
    ({ payload: { tokens, pair, liquidity: lpTokenValue, minAmounts, dex } }) => {
      const { state: prepareState, run: prepare } = useTask(
        () =>
          dex.liquidity.prepareRmLiquidity({
            tokens,
            pair,
            liquidity: lpTokenValue,
            minAmounts,
          }),
        { immediate: true },
      )

      usePromiseLog(prepareState, 'liquidity-remove-prepare-supply')
      useNotifyOnError(prepareState, notify, 'Supply preparation failed')

      const { state: supplyState, run: supply } = useTask(async () => {
        const { send } = prepareState.fulfilled?.value ?? {}
        invariant(send)
        return send()
      })

      usePromiseLog(supplyState, 'liquidity-remove-supply')
      useNotifyOnError(supplyState, notify, 'Supply failed')

      wheneverFulfilled(supplyState, () => {
        liquidityListStore.quickPoll = true
      })

      const fee = computed(() => prepareState.fulfilled?.value?.fee)

      return readonly({
        prepare,
        supply,
        fee,
        prepareState: promiseStateToFlags(prepareState),
        supplyState: promiseStateToFlags(supplyState),
      })
    },
  )

  return {
    isReadyToPrepareSupply,
    prepareState: computed(() => scope.value?.expose.prepareState ?? null),
    fee: computed(() => scope.value?.expose.fee ?? null),
    supplyState: computed(() => scope.value?.expose.supplyState ?? null),
    supply: () => scope.value?.expose.supply(),
    prepare: () => {
      if (scope.value) {
        scope.value.expose.prepare()
      } else {
        setActive(true)
      }
    },
    clear: () => {
      setActive(false)
    },
  }
}

function useRemoveAmounts(
  pairResult: Ref<null | PairAddressResult>,
  liquidity: Ref<null | Wei>,
): {
  pending: Ref<boolean>
  amounts: Ref<null | TokensPair<Wei>>
  touch: () => void
} {
  const dexStore = useDexStore()

  const scope = useParamScope(
    computed(() => {
      const activeDex = dexStore.active
      const pair = pairResult.value
      const lpTokenValue = liquidity.value
      if (!(lpTokenValue && activeDex.kind === 'named' && lpTokenValue.asBigInt && pair?.kind === 'exist')) return null

      const key = `dex-${activeDex.wallet}-${pair.addr}-${lpTokenValue.asStr}`

      return {
        key,
        payload: { pair: pair.addr, lpTokenValue, tokens: pair.tokens, dex: activeDex.dex() },
      }
    }),
    ({ payload: { pair, lpTokenValue, tokens, dex } }) => {
      const { state, run } = useTask(
        async () => {
          const { amounts } = await dex.liquidity.computeRmLiquidityAmounts({
            tokens,
            pair,
            liquidity: lpTokenValue,
          })
          return amounts
        },
        { immediate: true },
      )

      usePromiseLog(state, 'compute-remove-liquidity-amounts')

      return { state: flattenState(state), run }
    },
  )

  return {
    pending: computed(() => scope.value?.expose.state.pending ?? false),
    amounts: computed(() => scope.value?.expose.state.fulfilled ?? null),
    touch: () => scope.value?.expose.run(),
  }
}

function useSlippedAmounts(
  amounts: Ref<null | TokensPair<Wei>>,
  slippage: Ref<SlippagePercent>,
): Ref<null | TokensPair<Wei>> {
  return computed(() => amounts.value && buildPair((type) => adjustDown(amounts.value![type], slippage.value)))
}

export const useLiquidityRmStore = defineStore('liquidity-remove', () => {
  const router = useRouter()

  // #region Selection

  const selectionStore = useLiquidityRmSelectionStore()
  const { selected: selectedFiltered, selectedRaw } = storeToRefs(selectionStore)

  function navigateToLiquidity() {
    router.push({ name: RouteName.Liquidity })
  }

  const tokensStore = useTokensStore()
  const selectedTokensData = computed(() => {
    if (!selectedFiltered.value) return null

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const tokens = {} as TokensPair<Token>
    for (const type of TOKEN_TYPES) {
      const data = tokensStore.findTokenData(selectedFiltered.value[type])
      if (!data) return null
      tokens[type] = data
    }

    return tokens
  })
  const selectedTokensSymbols = computed(() => {
    const tokens = selectedTokensData.value
    if (!tokens) return null
    return buildPair((type) => tokens[type].symbol)
  })

  function setTokens(tokens: TokensPair<Address>) {
    selectedRaw.value = tokens
  }

  const { numeric: slippageNumeric, parsed: slippageParsed } = useRawSlippage(DEFAULT_SLIPPAGE_TOLERANCE)

  // #endregion

  // #region Pair

  const { pair: pairResult, pending: isPairPending, touch: touchPairAddress } = usePairAddress(selectedFiltered)
  const existingPair = computed(() => (pairResult.value?.kind === 'exist' ? pairResult.value : null))
  const doesPairExist = computedEagerUsingWatch(() => !!existingPair.value)

  const {
    result: pairBalanceResult,
    pending: isPairBalancePending,
    touch: touchPairBalance,
  } = usePairBalance(pairResult)

  const { totalSupply: pairTotalSupply, userBalance: pairUserBalance } = toRefs(
    useNullablePairBalanceComponents(pairBalanceResult),
  )

  const { result: pairReserves, pending: isReservesPending, touch: touchPairReserves } = usePairReserves(pairResult)

  // #endregion

  // #region Liquidity input

  const liquidity = shallowRef<null | Wei>(null)

  /**
   * liquidity value relative to pair balance of user
   *
   * **note**: works only when `pairUserBalance` is computed
   */
  const liquidityRelative = computed<number | null>({
    get: () => {
      const wei = liquidity.value ?? new Wei(0)
      const total = pairUserBalance.value
      if (!total) return null
      return wei.asBigNum.div(total.asBigNum).toNumber()
    },
    set: (rel) => {
      if (rel === null) return
      const total = pairUserBalance.value
      if (!total) return
      liquidity.value = new Wei(total.asBigNum.multipliedBy(rel).decimalPlaces(0))
    },
  })

  function setLiquidityToMax() {
    liquidityRelative.value = 1
  }

  function clear() {
    liquidity.value = null
    selectedRaw.value = null
  }

  // #endregion

  // #region Amounts

  const estimatedPoolShare = computed(() =>
    match(pairBalanceResult.value)
      .with(P.not(P.nullish), (balance) =>
        computeEstimatedPoolShare(balance, new Wei(-(liquidity.value?.asBigInt ?? 0n))),
      )
      .otherwise(() => null),
  )

  const { amounts, pending: isAmountsPending, touch: touchAmounts } = useRemoveAmounts(pairResult, liquidity)

  /**
   * i.e. min amounts
   */
  const slippedAmounts = useSlippedAmounts(amounts, slippageParsed)

  const tokens = computed(() => {
    const { lookupToken } = useMinimalTokensApi()
    const result = pairResult.value
    return result ? buildPair((type) => lookupToken(result.tokens[type])) : null
  })
  const tokenAmounts = computed(() => {
    const tokensValue = tokens.value
    const amountsValue = amounts.value
    if (!tokensValue || !amountsValue) return null
    return buildPair((type) => {
      const token = tokensValue[type]
      return token ? TokenAmount.fromWei(new TokenImpl(token), amountsValue[type]) : null
    })
  })

  const rates = useRates(computed(() => nonNullPair(tokenAmounts.value)))

  // #endregion

  // #region Supply

  const {
    fee,
    isReadyToPrepareSupply,
    supplyState,
    prepareState: prepareSupplyState,
    supply,
    prepare: prepareSupply,
    clear: clearSupply,
  } = usePrepareSupply({
    tokens: selectedFiltered,
    pairAddress: computed(() => existingPair.value?.addr ?? null),
    liquidity,
    minAmounts: slippedAmounts,
  })

  function closeSupply() {
    const wasFulfilled = !!supplyState.value?.fulfilled
    clearSupply()

    if (wasFulfilled) {
      navigateToLiquidity()
    } else {
      touchAmounts()
      touchPairBalance()
      touchPairReserves()
    }
  }

  // #endregion

  // #region etc

  /**
   * **NOTE**: we ignore `isPairPending` here.
   * We ignore it in "Refresh" logic in general.
   * Is that an issue?
   */
  const isRefreshing = logicOr(
    isAmountsPending,
    isPairBalancePending,
    isReservesPending,
    toRef(tokensStore, 'isBalancePending'),
  )

  const refresh = () => {
    touchPairAddress()
    touchAmounts()
    touchPairBalance()
    touchPairReserves()
    tokensStore.touchUserBalance()
  }

  // #endregion

  return {
    selected: selectedFiltered,
    selectedTokensData,
    selectedTokensSymbols,

    pairUserBalance,
    pairTotalSupply,
    poolShare: estimatedPoolShare,
    pairReserves,
    isReservesPending,
    isPairBalancePending,
    isPairPending,
    doesPairExist,
    pairResult,

    liquidity,
    liquidityRelative,
    amounts,
    amountsSlipped: slippedAmounts,
    rates,
    isAmountsPending,

    isReadyToPrepareSupply,
    fee,
    prepareSupplyState,
    supplyState,

    setTokens,
    prepareSupply,
    setLiquidityToMax,
    clear,
    supply,
    closeSupply,

    isRefreshing,
    refresh,

    slippageNumeric,
    slippageParsed,
  }
})

if (import.meta.hot) acceptHMRUpdate(useLiquidityRmStore, import.meta.hot)
