/* eslint-disable max-nested-callbacks */
import { deadlineFiveMinutesFromNow, Address, Wei, WeiAsToken, NATIVE_TOKEN_FULL, DEX_TOKEN_FULL } from '@/core'
import {
  usePairAddress,
  usePairBalance,
  usePairReserves,
  useNullablePairBalanceComponents,
  computeEstimatedPoolShare,
} from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import { buildPair, mirrorTokenType, nonNullPair, TokensPair, TokenType } from '@/utils/pair'
import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'
import { useRates } from '@/modules/ModuleTradeShared/composable.rates'
import {
  usePairInput,
  useEstimatedLayer,
  useLocalStorageAddrsOrigin,
  useRouteAddrsOrigin,
} from '@/modules/ModuleTradeShared/composable.pair-input'
import { RouteName } from '@/types'
import { TokenAddressAndDesiredValue } from '@/core/domain/liquidity'
import { useControlledComposedKey } from '@/utils/composable.controlled-composed-key'
import { match, P } from 'ts-pattern'

type SupplyTokens = TokensPair<TokenAddressAndDesiredValue>

interface MainInput {
  type: TokenType
  wei: Wei
}

function useAmounts(props: {
  pairAndInput: Ref<null | {
    pair: Address
    input: MainInput
    tokens: TokensPair<Address>
  }>
}) {
  const dexStore = useDexStore()

  const scope = useParamScope(
    () =>
      match(props.pairAndInput.value)
        .with(P.not(P.nullish), ({ pair, tokens, input: { wei: input, type: quoteFrom } }) => {
          const quoteFor = mirrorTokenType(quoteFrom)

          return {
            key: `${dexStore.anyDex.key}-${pair}-${quoteFor}-${input}`,
            payload: { pair, tokens, quoteFor, input, dex: dexStore.anyDex.dex() },
          }
        })
        .with(null, () => null)
        .exhaustive(),
    ({ payload: { pair, tokens, quoteFor, input, dex } }) => {
      const { state, run } = useTask(
        async () => dex.liquidity.computeAddLiquidityAmountsForExistingPair({ pair, tokens, input, quoteFor }),
        { immediate: true },
      )
      usePromiseLog(state, 'add-liquidity-quoting')

      return { state: flattenState(state), run }
    },
  )

  const quotePendingFor = computed(() => (scope.value?.expose.state.pending ? scope.value.payload.quoteFor : null))
  const isPending = computed(() => scope.value?.expose.state.pending ?? false)

  const result = computed(() =>
    match(scope.value)
      .with(
        {
          payload: P.select('props'),
          expose: {
            state: {
              fulfilled: P.select('fulfilled', P.not(P.nullish)),
            },
          },
        },
        ({ props, fulfilled }) => ({ props, ...fulfilled }),
      )
      .otherwise(() => null),
  )

  const touch = () => scope.value?.expose.run()

  return { quotePendingFor, isPending, result, touch }
}

function usePrepareSupply(props: { tokens: Ref<SupplyTokens | null> }) {
  const dexStore = useDexStore()
  const { notify } = useNotify()

  const scopeKey = computed(() => {
    const activeDex = dexStore.active
    const { tokenA, tokenB } = props.tokens.value ?? {}

    return (
      tokenA &&
      tokenB &&
      activeDex.kind === 'named' && {
        key: `dex-${activeDex.wallet}-${tokenA.addr}-${tokenA.desired}-${tokenB.addr}-${tokenB.desired}`,
        payload: { tokens: { tokenA, tokenB }, dex: activeDex.dex() },
      }
    )
  })

  const { filteredKey, setActive } = useControlledComposedKey(scopeKey)

  const scope = useParamScope(filteredKey, ({ payload: { tokens, dex } }) => {
    const { state: statePrepare, run: runPrepare } = useTask(
      async () => {
        const { send, fee } = await dex.liquidity.prepareAddLiquidity({
          tokens,
          deadline: deadlineFiveMinutesFromNow(),
        })
        return { send, fee }
      },
      { immediate: true },
    )

    function prepare() {
      !statePrepare.pending && runPrepare()
    }

    const { state: stateSupply, run: supply } = useTask(async () => {
      invariant(statePrepare.fulfilled)
      await statePrepare.fulfilled.value.send()
    })

    usePromiseLog(statePrepare, 'add-liquidity-prepare')
    usePromiseLog(stateSupply, 'add-liquidity-supply')
    useNotifyOnError(statePrepare, notify, 'Preparation failed')
    useNotifyOnError(stateSupply, notify, 'Liquidity addition failed')
    wheneverFulfilled(stateSupply, () => {
      notify({ type: 'ok', description: 'Liquidity addition succeeded!' })
    })

    const fee = computed(() => statePrepare.fulfilled?.value.fee ?? null)
    const statePrepareFlags = promiseStateToFlags(statePrepare)
    const stateSupplyFlags = promiseStateToFlags(stateSupply)

    return readonly({
      prepare,
      fee,
      prepareState: statePrepareFlags,
      supplyState: stateSupplyFlags,
      supply,
    })
  })

  return {
    prepare: () => {
      if (scope.value) {
        scope.value.expose.prepare()
      } else {
        setActive(true)
      }
    },
    clear: () => setActive(false),
    scope: computed(() => scope.value?.expose),
  }
}

export const useLiquidityAddStore = defineStore('liquidity-add', () => {
  const route = useRoute()
  const tokensStore = useTokensStore()
  const dexStore = useDexStore()

  const isActiveRoute = computed(() => route.name === RouteName.LiquidityAdd)

  // #region Selection

  const routeAddrsOrigin = useRouteAddrsOrigin({
    baseToken: NATIVE_TOKEN_FULL.address,
    additionalBaseToken: DEX_TOKEN_FULL.address,
    isActive: isActiveRoute,
  })
  const localStorageAddrsOrigin = useLocalStorageAddrsOrigin('liquidity-add-selection', isActiveRoute)

  const addrsOrigin = computed({
    get() {
      if (routeAddrsOrigin.value.tokenA && routeAddrsOrigin.value.tokenB) return routeAddrsOrigin.value
      return localStorageAddrsOrigin.value
    },
    set(value) {
      localStorageAddrsOrigin.value = value
    },
  })

  const selection = usePairInput({ addrsOrigin })
  const { tokens, resetInput, tokenValues } = selection
  const symbols = computed(() => buildPair((type) => tokens[type]?.symbol ?? null))
  const addrsReadonly = readonly(selection.addrs)

  function setTokenAddress(type: TokenType, address: Address) {
    selection.addrs[type] = address
  }

  function setBothAddresses(tokens: TokensPair<Address>) {
    selection.setBothAddrs(tokens)
    resetInput()
  }

  // #endregion

  // #region Pair address

  const { pair: gotPair } = usePairAddress(addrsReadonly)
  const isEmptyPair = computed(() => gotPair.value?.kind === 'empty')
  const doesPairExist = computed(() => gotPair.value?.kind === 'exist')

  // #endregion

  // #region Pair balance & reserves

  const {
    result: pairBalance,
    touch: touchPairBalance,
    pending: isPairBalancePending,
  } = usePairBalance(addrsReadonly, doesPairExist)

  const {
    result: pairReserves,
    touch: touchPairReserves,
    pending: isPairReservesPending,
  } = usePairReserves(addrsReadonly, doesPairExist)

  const { userBalance: pairUserBalance, totalSupply: pairTotalSupply } = toRefs(
    useNullablePairBalanceComponents(pairBalance),
  )

  // #endregion

  // #region Estimated layer

  const { setMainToken, setEstimated, estimatedFor } = useEstimatedLayer(selection)

  const isValuesDebounceWelcome = doesPairExist

  // #endregion

  // #region Quoting

  const quotingMainInput = computed<null | MainInput>(() => {
    if (isEmptyPair.value) return null

    const quoteFor = estimatedFor.value
    if (!quoteFor) return null

    const quoteFrom = mirrorTokenType(quoteFor)
    const wei = selection.weiFromTokens[quoteFrom]
    if (!wei) return null

    return { type: quoteFrom, wei }
  })

  const {
    quotePendingFor: isQuotePendingFor,
    isPending: isAmountsPending,
    result: quoteAndLiquidityResult,
    touch: touchQuote,
  } = useAmounts({
    pairAndInput: computed(() =>
      match({ pair: gotPair.value, input: quotingMainInput.value })
        .with(
          {
            pair: { kind: 'exist', addr: P.select('pair'), tokens: P.select('tokens') },
            input: P.select('input', P.not(P.nullish)),
          },
          (x) => x,
        )
        .otherwise(() => null),
    ),
  })

  watch(
    [quoteAndLiquidityResult, selection.tokens],
    ([result, tokens]) => {
      if (result && tokens[result.props.quoteFor]) {
        const token = result.quoted.decimals(tokens[result.props.quoteFor]!)
        setEstimated(token.toFixed() as WeiAsToken)
      }
    },
    { immediate: true, deep: true },
  )

  const supplyTokensFromQuoting = computed<null | SupplyTokens>(() =>
    match(quoteAndLiquidityResult.value)
      .with(P.not(P.nullish), ({ quoted: amount, props: { quoteFor, input: referenceValue, tokens } }) =>
        buildPair((type) => ({ addr: tokens[type], desired: quoteFor === type ? amount : referenceValue })),
      )
      .with(null, () => null)
      .exhaustive(),
  )

  const estimatedForAfterQuoting = computed<null | TokenType>(() => {
    return quoteAndLiquidityResult.value?.props.quoteFor ?? null
  })

  /**
   * Computes liquidity even for empty pair
   */
  const liquidityByAmounts = computed<null | Wei>(() =>
    match(gotPair.value)
      .with({ kind: 'exist' }, (): null | Wei =>
        match(quoteAndLiquidityResult.value)
          .with({ liquidity: P.select() }, (x) => x)
          .otherwise(() => null),
      )
      .with({ kind: 'empty' }, () =>
        match(nonNullPair(selection.weiFromTokens))
          .with(
            P.not(P.nullish),
            (input) => dexStore.anyDex.dex().liquidity.computeAddLiquidityAmountsForEmptyPair({ input }).liquidity,
          )
          .otherwise(() => null),
      )
      .otherwise(() => null),
  )

  const poolShare = computed(() => {
    if (pairBalance.value && !isAmountsPending.value)
      return computeEstimatedPoolShare(pairBalance.value, liquidityByAmounts.value ?? new Wei(0))
    return null
  })

  // #endregion

  // #region Supply

  const supplyTokens = computed((): null | SupplyTokens => {
    const pair = gotPair.value

    if (pair) {
      if (pair.kind === 'empty') {
        // get amounts from inputs
        const input = selection.completeWeiPair.value
        return input && buildPair((type) => ({ addr: input[type].address, desired: input[type].wei }))
      } else {
        // get amounts from quoting
        return supplyTokensFromQuoting.value
      }
    }

    return null
  })

  const finalRates = useRates(
    computed(() => {
      const supply = supplyTokens.value
      return supply && buildPair((type) => supply[type].desired)
    }),
  )

  const { prepare: prepareSupply, clear: clearSupply, scope: supplyScope } = usePrepareSupply({ tokens: supplyTokens })

  const closeSupply = () => {
    clearSupply()
  }

  // #endregion

  // #region etc

  const isRefreshing = logicOr(
    toRef(tokensStore, 'isBalancePending'),
    isPairBalancePending,
    isPairReservesPending,
    computed(() => !!isQuotePendingFor.value),
  )

  const refresh = () => {
    touchPairBalance()
    touchPairReserves()
    touchQuote()
    tokensStore.touchUserBalance()
  }

  // #endregion

  return {
    tokenValues: readonly(tokenValues),
    estimatedFor: estimatedForAfterQuoting,
    addrs: addrsReadonly,
    symbols,
    tokens,
    isEmptyPair,
    pair: gotPair,
    pairUserBalance,
    pairTotalSupply,
    poolShare,
    pairReserves,

    isQuotePendingFor,

    isValuesDebounceWelcome,
    setToken: setMainToken,
    setTokenAddress,
    setBothAddresses,
    resetInput,

    finalRates,
    supplyScope,
    prepareSupply,
    closeSupply,

    isRefreshing,
    refresh,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useLiquidityAddStore, import.meta.hot))
