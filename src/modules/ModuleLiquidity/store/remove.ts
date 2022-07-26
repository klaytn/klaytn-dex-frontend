import { Address, asWei, Token, tokenRawToWei, tokenWeiToRaw, ValueWei, WeiNumStrBn } from '@/core/kaikas'
import { LP_TOKEN_DECIMALS as LP_TOKEN_DECIMALS_VALUE } from '@/core/kaikas/const'
import {
  useNullablePairBalanceComponents,
  usePairAddress,
  usePairBalance,
  usePairReserves,
} from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import { buildPair, TokensPair, TOKEN_TYPES } from '@/utils/pair'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'
import { useRates } from '@/modules/ModuleTradeShared/composable.rates'

const LP_TOKENS_DECIMALS = Object.freeze({ decimals: LP_TOKEN_DECIMALS_VALUE })

function usePrepareSupply(props: {
  tokens: Ref<null | TokensPair<Address>>
  pairAddress: Ref<null | Address>
  liquidity: Ref<ValueWei<string> | null>
  amounts: Ref<null | TokensPair<ValueWei<BN>>>
}) {
  const kaikasStore = useKaikasStore()
  const tokensStore = useTokensStore()

  const [active, setActive] = useToggle(false)

  const scopeKey = computed(() => {
    const tokens = props.tokens.value
    const pair = props.pairAddress.value
    const liquidity = props.liquidity.value
    const amounts = props.amounts.value
    if (!(tokens && pair && liquidity && amounts)) return null

    return {
      key:
        // `pair` also represents both `tokenA` + `tokenB`
        // `liquidity` also **should** strictly represent `amounts`
        `${pair}-${liquidity}`,
      payload: { tokens, pair, liquidity, amounts },
    }
  })
  watch(scopeKey, () => setActive(false))

  const isReadyToPrepareSupply = computed(() => !!scopeKey.value)

  const scope = useParamScope(
    computed(() => active.value && scopeKey.value),
    ({ tokens, pair, liquidity: lpTokenValue, amounts }) => {
      const { state: prepareState, run: prepare } = useTask(
        () =>
          kaikasStore.getKaikasAnyway().liquidity.prepareRmLiquidity({
            tokens,
            pair,
            lpTokenValue,
            // we want to burn it all for sure
            minAmounts: amounts,
          }),
        { immediate: true },
      )

      usePromiseLog(prepareState, 'liquidity-remove-prepare-supply')
      useNotifyOnError(prepareState, 'Supply preparation failed')

      const { state: supplyState, run: supply } = useTask(async () => {
        const { send } = prepareState.fulfilled?.value ?? {}
        invariant(send)
        return send()
      })

      usePromiseLog(supplyState, 'liquidity-remove-supply')
      useNotifyOnError(supplyState, 'Supply failed')
      wheneverFulfilled(supplyState, () => {
        tokensStore.touchUserBalance()
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
  tokens: Ref<null | TokensPair<Address>>,
  pair: Ref<null | Address>,
  liquidity: Ref<null | WeiNumStrBn>,
): {
  pending: Ref<boolean>
  amounts: Ref<null | TokensPair<ValueWei<BN>>>
  touch: () => void
} {
  const kaikasStore = useKaikasStore()

  const taskScope = useParamScope(
    computed(() => {
      if (!kaikasStore.isConnected) return null
      if (!tokens.value) return null
      const pairAddr = pair.value
      const lpTokenValue = liquidity.value
      if (!pairAddr || !lpTokenValue) return null

      const key = `${pairAddr}-${lpTokenValue}`

      return {
        key,
        payload: { pair: pairAddr, lpTokenValue, tokens: tokens.value, kaikas: kaikasStore.getKaikasAnyway() },
      }
    }),
    ({ pair, lpTokenValue, tokens, kaikas }) => {
      const { state, run } = useTask(
        async () => {
          const { amounts } = await kaikas.liquidity.computeRmLiquidityAmounts({
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
    pending: computed(() => taskScope.value?.expose.state.pending ?? false),
    amounts: computed(() => taskScope.value?.expose.state.fulfilled ?? null),
    touch: () => taskScope.value?.expose.run(),
  }
}

export const useLiquidityRmStore = defineStore('liquidity-remove', () => {
  const selected = useLocalStorage<null | TokensPair<Address>>('liquidity-remove-tokens', null, {
    serializer: {
      read: (raw) => JSON.parse(raw),
      write: (parsed) => JSON.stringify(parsed),
    },
  })

  const tokensStore = useTokensStore()
  const selectedTokensData = computed(() => {
    if (!selected.value) return null

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const tokens = {} as TokensPair<Token>
    for (const type of TOKEN_TYPES) {
      const data = tokensStore.findTokenData(selected.value[type])
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

  const { pair: pairResult, pending: isPairPending } = usePairAddress(selected)
  const existingPair = computed(() => (pairResult.value?.kind === 'exist' ? pairResult.value : null))
  const isPairLoaded = computed(() => !!existingPair.value)

  const {
    result: pairBalanceResult,
    pending: isPairBalancePending,
    touch: touchPairBalance,
  } = usePairBalance(selected, isPairLoaded)
  const {
    totalSupply: pairTotalSupply,
    userBalance: pairUserBalance,
    poolShare: pairPoolShare,
  } = toRefs(useNullablePairBalanceComponents(pairBalanceResult))
  const formattedPoolShare = useFormattedPercent(pairPoolShare, 7)

  const { result: pairReserves, pending: isReservesPending, touch: touchPairReserves } = usePairReserves(selected)

  const liquidityRaw = ref('')
  const liquidity = computed<ValueWei<string> | null>({
    get: () => {
      const raw = liquidityRaw.value
      if (!raw) return null
      return tokenRawToWei(LP_TOKENS_DECIMALS, raw)
    },
    set: (wei) => {
      if (wei) {
        liquidityRaw.value = tokenWeiToRaw(LP_TOKENS_DECIMALS, wei)
      }
    },
  })

  /**
   * liquidity value relative to pair balance of user
   */
  const liquidityRelative = computed<number | null>({
    get: () => {
      const wei = liquidity.value ?? '0'
      const total = pairUserBalance.value
      if (!total) return null
      return new BigNumber(wei).div(total).toNumber()
    },
    set: (rel) => {
      if (rel === null) return
      const total = pairUserBalance.value
      if (!total) return
      liquidity.value = asWei(new BigNumber(total).multipliedBy(rel).toString())
    },
  })

  const {
    amounts,
    pending: isAmountsPending,
    touch: touchAmounts,
  } = useRemoveAmounts(
    selected,
    computed(() => existingPair.value?.addr ?? null),
    liquidity,
  )

  const rates = useRates(amounts)

  function setTokens(tokens: TokensPair<Address>) {
    selected.value = tokens
  }

  function setLiquidityToMax() {
    liquidityRelative.value = 1
  }

  function clear() {
    liquidityRaw.value = ''
  }

  const {
    fee,
    isReadyToPrepareSupply,
    supplyState,
    prepareState: prepareSupplyState,
    supply,
    prepare: prepareSupply,
    clear: clearSupply,
  } = usePrepareSupply({
    tokens: selected,
    pairAddress: computed(() => existingPair.value?.addr ?? null),
    liquidity,
    amounts,
  })

  function closeSupply() {
    if (supplyState.value?.fulfilled) {
      touchAmounts()
      touchPairBalance()
      touchPairReserves()
    }

    clearSupply()
  }

  return {
    selected,
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
    isPairLoaded,

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
