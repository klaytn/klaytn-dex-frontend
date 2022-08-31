import { Address, Token, Wei, WeiAsToken, LP_TOKEN_DECIMALS as LP_TOKEN_DECIMALS_VALUE } from '@/core'
import {
  useNullablePairBalanceComponents,
  usePairAddress,
  usePairBalance,
  usePairReserves,
} from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import { buildPair, TokensPair, TOKEN_TYPES } from '@/utils/pair'
import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'
import { useRates } from '@/modules/ModuleTradeShared/composable.rates'
import { JSON_SERIALIZER } from '@/utils/common'
import { Serializer } from '@vueuse/core'
import { RouteName } from '@/types'
import { useControlledComposedKey } from '@/utils/composable.controlled-composed-key'

const LP_TOKENS_DECIMALS = Object.freeze({ decimals: LP_TOKEN_DECIMALS_VALUE })

function usePrepareSupply(props: {
  tokens: Ref<null | TokensPair<Address>>
  pairAddress: Ref<null | Address>
  liquidity: Ref<Wei | null>
  amounts: Ref<null | TokensPair<Wei>>
  whenSupplied: () => void
}) {
  const dexStore = useDexStore()
  const { notify } = useNotify()

  const scopeKey = computed(() => {
    const tokens = props.tokens.value
    const pair = props.pairAddress.value
    const liquidity = props.liquidity.value
    const amounts = props.amounts.value
    const activeDex = dexStore.active

    return (
      tokens &&
      pair &&
      liquidity &&
      amounts &&
      activeDex.kind === 'named' && {
        key:
          // `pair` also represents both `tokenA` + `tokenB`
          // `liquidity` also **should** strictly represent `amounts`
          `dex-${activeDex.wallet}-${pair}-${liquidity}`,
        payload: { tokens, pair, liquidity, amounts, dex: activeDex.dex() },
      }
    )
  })

  const { filteredKey, setActive } = useControlledComposedKey(scopeKey)

  const isReadyToPrepareSupply = computed(() => !!scopeKey.value)

  const scope = useParamScope(filteredKey, ({ tokens, pair, liquidity: lpTokenValue, amounts, dex }) => {
    const { state: prepareState, run: prepare } = useTask(
      () =>
        dex.liquidity.prepareRmLiquidity({
          tokens,
          pair,
          lpTokenValue,
          // we want to burn it all for sure
          minAmounts: amounts,
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
    wheneverFulfilled(supplyState, props.whenSupplied)

    const fee = computed(() => prepareState.fulfilled?.value?.fee)

    return readonly({
      prepare,
      supply,
      fee,
      prepareState: promiseStateToFlags(prepareState),
      supplyState: promiseStateToFlags(supplyState),
    })
  })

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
  tokens: Ref<null | TokensPair<Address>>,
  pair: Ref<null | Address>,
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
      if (!tokens.value || activeDex.kind !== 'named') return null
      const pairAddr = pair.value
      const lpTokenValue = liquidity.value
      if (!pairAddr || !lpTokenValue || !lpTokenValue.asBigInt) return null

      const key = `dex-${activeDex.wallet}-${pairAddr}-${lpTokenValue.asStr}`

      return {
        key,
        payload: { pair: pairAddr, lpTokenValue, tokens: tokens.value, dex: activeDex.dex() },
      }
    }),
    ({ pair, lpTokenValue, tokens, dex }) => {
      const { state, run } = useTask(
        async () => {
          const { amounts } = await dex.liquidity.computeRmLiquidityAmounts({
            tokens,
            pair,
            lpTokenValue,
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

export const useLiquidityRmStore = defineStore('liquidity-remove', () => {
  const route = useRoute()
  const router = useRouter()

  const isActiveRoute = computed(() => route.name === RouteName.LiquidityRemove)

  // #region Selection

  const selectedRaw = useLocalStorage<null | TokensPair<Address>>('liquidity-remove-tokens', null, {
    serializer: JSON_SERIALIZER as Serializer<any>,
  })
  const selectedFiltered = computed(() => (isActiveRoute.value ? unref(selectedRaw) : null))

  function navigateToLiquidity() {
    router.push({ name: RouteName.Liquidity })
  }

  // there is no point to stay here if there is no selection
  whenever(() => isActiveRoute.value && !selectedRaw.value, navigateToLiquidity)

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

  // #endregion

  // #region Pair

  const { pair: pairResult, pending: isPairPending } = usePairAddress(selectedFiltered)
  const existingPair = computed(() => (pairResult.value?.kind === 'exist' ? pairResult.value : null))
  const doesPairExist = eagerComputed(() => !!existingPair.value)

  const {
    result: pairBalanceResult,
    pending: isPairBalancePending,
    touch: touchPairBalance,
  } = usePairBalance(selectedFiltered, doesPairExist)

  const {
    totalSupply: pairTotalSupply,
    userBalance: pairUserBalance,
    poolShare: pairPoolShare,
  } = toRefs(useNullablePairBalanceComponents(pairBalanceResult))

  const formattedPoolShare = useFormattedPercent(pairPoolShare, 7)

  const {
    result: pairReserves,
    pending: isReservesPending,
    touch: touchPairReserves,
  } = usePairReserves(selectedFiltered, doesPairExist)

  // #endregion

  // #region Liquidity input

  const liquidityRaw = ref('' as WeiAsToken)
  const liquidity = computed<Wei | null>({
    get: () => {
      const raw = liquidityRaw.value
      if (!raw) return null
      return Wei.fromToken(LP_TOKENS_DECIMALS, raw)
    },
    set: (wei) => {
      if (wei) {
        liquidityRaw.value = wei.toToken(LP_TOKENS_DECIMALS)
      }
    },
  })

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
    liquidityRaw.value = '' as WeiAsToken
  }

  // #endregion

  // #region Amounts

  const {
    amounts,
    pending: isAmountsPending,
    touch: touchAmounts,
  } = useRemoveAmounts(
    selectedFiltered,
    computed(() => existingPair.value?.addr ?? null),
    liquidity,
  )

  const rates = useRates(amounts)

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
    amounts,
    whenSupplied: () => {
      tokensStore.touchUserBalance()
      navigateToLiquidity()
    },
  })

  function closeSupply() {
    if (supplyState.value?.fulfilled) {
      touchAmounts()
      touchPairBalance()
      touchPairReserves()
    }

    clearSupply()
  }

  // #endregion

  return {
    selected: selectedFiltered,
    selectedTokensData,
    selectedTokensSymbols,

    pairUserBalance,
    pairTotalSupply,
    pairPoolShare,
    formattedPoolShare,
    pairReserves,
    isReservesPending,
    isPairBalancePending,
    isPairPending,
    isPairLoaded: doesPairExist,

    liquidity,
    liquidityRaw,
    liquidityRelative,
    amounts,
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
  }
})

if (import.meta.hot) acceptHMRUpdate(useLiquidityRmStore, import.meta.hot)
