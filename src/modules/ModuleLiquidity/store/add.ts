import { deadlineFiveMinutesFromNow, Address, Wei, WeiAsToken } from '@/core'
import {
  usePairAddress,
  PairAddressResult,
  usePairBalance,
  usePairReserves,
} from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import { buildPair, mirrorTokenType, TokensPair, TokenType } from '@/utils/pair'
import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'
import { useRates } from '@/modules/ModuleTradeShared/composable.rates'
import {
  usePairInput,
  useEstimatedLayer,
  useLocalStorageAddrsOrigin,
} from '@/modules/ModuleTradeShared/composable.pair-input'
import { RouteName } from '@/types'
import { TokenAddressAndDesiredValue } from '@/core/domain/liquidity'
import { useControlledComposedKey } from '@/utils/composable.controlled-composed-key'

type SupplyTokens = TokensPair<TokenAddressAndDesiredValue>

interface MainInput {
  type: TokenType
  wei: Wei
}

function useQuoting(props: { pair: Ref<null | PairAddressResult>; mainInput: Ref<null | MainInput> }) {
  const dexStore = useDexStore()

  const scope = useParamScope(
    computed(() => {
      if (props.pair.value?.kind !== 'exist') return null
      const { tokens, addr: pair } = props.pair.value

      const { type: quoteFrom, wei: value } = props.mainInput.value ?? {}
      if (!quoteFrom || !value) return null
      const quoteFor = mirrorTokenType(quoteFrom)

      return {
        key: `${pair}-${quoteFor}-${value}`,
        payload: { tokens, quoteFor, quoteFrom, value },
      }
    }),
    ({ tokens: { tokenA, tokenB }, quoteFor, value }) => {
      const { state, run } = useTask(
        () =>
          dexStore.anyDex
            .dex()
            .tokens.getTokenQuote({
              tokenA,
              tokenB,
              value,
              quoteFor,
            })
            .then((value) => ({ exchangeRate: value })),
        { immediate: true },
      )
      usePromiseLog(state, 'add-liquidity-quoting')

      return { state: flattenState(state), run }
    },
  )

  const pendingFor = computed(() => (scope.value?.expose.state.pending ? scope.value.payload.quoteFor : null))
  const exchangeRate = computed(() => {
    if (!scope.value) return null
    const {
      payload: props,
      expose: {
        state: { fulfilled },
      },
    } = scope.value
    if (!fulfilled) return null
    return { props, value: fulfilled.exchangeRate }
  })
  const touch = () => scope.value?.expose.run()

  return { pendingFor, exchangeRate, touch }
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

  const scope = useParamScope(filteredKey, ({ tokens, dex }) => {
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

  const isActiveRoute = computed(() => route.name === RouteName.LiquidityAdd)

  // #region Selection

  const selection = usePairInput({ addrsOrigin: useLocalStorageAddrsOrigin('liquidity-add-selection', isActiveRoute) })
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

  const {
    userBalance: pairUserBalance,
    totalSupply: pairTotalSupply,
    poolShare,
  } = toRefs(
    toReactive(
      computed(() => {
        const { userBalance = null, totalSupply = null, poolShare = null } = pairBalance.value ?? {}
        return { userBalance, totalSupply, poolShare }
      }),
    ),
  )

  const formattedPoolShare = useFormattedPercent(poolShare, 7)

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
    pendingFor: isQuotePendingFor,
    exchangeRate: quoteExchangeRate,
    touch: touchQuote,
  } = useQuoting({
    pair: gotPair,
    mainInput: quotingMainInput,
  })

  watch(
    [quoteExchangeRate, selection.tokens],
    ([rate, tokens]) => {
      if (rate && tokens[rate.props.quoteFor]) {
        const token = rate.value.toToken(tokens[rate.props.quoteFor]!)
        setEstimated(token)
      }
    },
    { immediate: true, deep: true },
  )

  const supplyTokensFromQuoting = computed<null | SupplyTokens>(() => {
    if (quoteExchangeRate.value) {
      const {
        value: amount,
        props: { quoteFor, value: referenceValue, tokens },
      } = quoteExchangeRate.value
      return buildPair((type) => ({ addr: tokens[type], desired: quoteFor === type ? amount : referenceValue }))
    }
    return null
  })

  const estimatedForAfterQuoting = computed<null | TokenType>(() => {
    return quoteExchangeRate.value?.props.quoteFor ?? null
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
    formattedPoolShare,
    pairReserves,

    isQuotePendingFor,
    quoteExchangeRate,

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
