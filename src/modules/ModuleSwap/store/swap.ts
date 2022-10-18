import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { Address, CurrencySymbol, WeiAsToken, Wei, TokenImpl, Pair, TokenAmount, LP_TOKEN_DECIMALS } from '@/core'
import { TokenType, TokensPair, mirrorTokenType, buildPair } from '@/utils/pair'
import Debug from 'debug'
import { useSwapAmounts, GetAmountsProps, computeSlippage, useSlippageParsed } from '../composable.get-amounts'
import { useTrade } from '../composable.trade'
import { useSwapValidation } from '../composable.validation'
import { buildSwapProps, PropsToBuildSwapProps } from '../util.swap-props'
import {
  usePairInput,
  useEstimatedLayer,
  useLocalStorageAddrsOrigin,
} from '../../ModuleTradeShared/composable.pair-input'
import { Ref } from 'vue'
import { useRates } from '@/modules/ModuleTradeShared/composable.rates'
import { RouteName } from '@/types'
import { useControlledComposedKey } from '@/utils/composable.controlled-composed-key'
import { usePairsQuery } from '../query.pairs'
import { numberToPercent } from '@/utils/common'
import { match, P } from 'ts-pattern'

const SLIPPAGE_PRECISION = 5

const debugModule = Debug('swap-store')

function useSwap(
  props: Ref<null | PropsToBuildSwapProps>,
  options: {
    onSuccess: () => void
  },
) {
  const dexStore = useDexStore()
  const { notify } = useNotify()

  const swapKey = computed(() => {
    if (!props.value) return null
    const {
      trade: {
        route: {
          input: { address: input },
          output: { address: output },
        },
      },
      amounts,
    } = props.value

    return (
      dexStore.active.kind === 'named' && {
        key:
          // NOTE: we do not put `expertMode` here because it actually doesn't produce any significant effect
          `${input}-${output}-${
            amounts.mode === 'exact-in'
              ? `exact-in-${amounts.amountIn}-${amounts.amountOutMin}`
              : `exact-out-${amounts.amountInMax}-${amounts.amountOut}`
          }`,
        payload: { props: props.value, swap: dexStore.active.dex().swap },
      }
    )
  })

  const { filteredKey, setActive } = useControlledComposedKey(swapKey)

  const scope = useParamScope(filteredKey, ({ props, swap: swapAgent }) => {
    const { state: prepareState, run: prepare } = useTask(
      async () => {
        const swapProps = buildSwapProps(props)
        const { send, fee } = await swapAgent.prepareSwap(swapProps)
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
    wheneverFulfilled(swapState, options.onSuccess)
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
  const dexStore = useDexStore()
  const tokensStore = useTokensStore()

  const pageRoute = useRoute()
  const isActiveRoute = computed(() => pageRoute.name === RouteName.Swap)

  const multihops = useLocalStorage<boolean>('swap-multi-hops', false)

  const slippageTolerance = ref(0)

  const expertMode = ref(false)

  // #region selection

  const selection = usePairInput({ addrsOrigin: useLocalStorageAddrsOrigin('swap-selection', isActiveRoute) })
  const { tokens, resetInput, tokenValues } = selection
  const addrsReadonly = readonly(selection.addrs)

  const tokenImpls = reactive(
    buildPair((type) =>
      computed(() => {
        const token = tokens[type]
        return token && new TokenImpl(token)
      }),
    ),
  )

  const symbols = computed(() => buildPair((type) => tokens[type]?.symbol ?? null))

  function setTokenAddress(type: TokenType, addr: Address | null) {
    selection.addrs[type] = addr
  }

  function setBothTokens(pair: TokensPair<Address | null>) {
    selection.setBothAddrs(pair)
    resetInput()
  }

  const { estimatedFor, setEstimated, setMainToken } = useEstimatedLayer(selection)

  function swapTokensWithEachOther() {
    const currentMain = estimatedFor.value && mirrorTokenType(estimatedFor.value)
    selection.setBothAddrs({ tokenA: addrsReadonly.tokenB, tokenB: addrsReadonly.tokenA })
    if (currentMain) {
      const newMain = mirrorTokenType(currentMain)
      const mainValue = tokenValues[currentMain]
      invariant(mainValue)
      tokenValues[currentMain] = null
      setMainToken(newMain, mainValue)
    }
  }

  // #endregion

  // #region Pair data

  const PairsQuery = usePairsQuery()

  const pairs = computed(() => {
    return (
      PairsQuery.result.value?.pairs.map((pair) => {
        const token0 = new TokenImpl({
          name: pair.token0.name,
          address: pair.token0.id,
          decimals: Number(pair.token0.decimals),
          symbol: pair.token0.symbol,
        })
        const token1 = new TokenImpl({
          name: pair.token1.name,
          address: pair.token1.id,
          decimals: Number(pair.token1.decimals),
          symbol: pair.token1.symbol,
        })
        const pairSymbol = (token0.symbol + '-' + token1.symbol) as CurrencySymbol
        return new Pair({
          liquidityToken: new TokenImpl({
            address: pair.id,
            decimals: LP_TOKEN_DECIMALS,
            symbol: pairSymbol,
            name: pairSymbol,
          }),
          token0: TokenAmount.fromToken(token0, pair.reserve0),
          token1: TokenAmount.fromToken(token1, pair.reserve1),
        })
      }) ?? null
    )
  })

  // #endregion

  // #region Route & Amounts

  const inputAmount = computed(() => {
    const amountFor = estimatedFor.value
    if (!amountFor) return null

    const amountFrom = mirrorTokenType(amountFor)
    const referenceValue = selection.weiFromTokens[amountFrom]
    if (!referenceValue?.asBigInt) return null

    return {
      for: amountFor,
      from: amountFrom,
      wei: referenceValue,
    }
  })

  const tradeResult = useTrade({
    pairs,
    amount: inputAmount,
    tokens: tokenImpls,
    disableMultiHops: logicNot(multihops),
  })

  const trade = computed(() => (tradeResult.value?.kind === 'ok' ? tradeResult.value.trade : null))
  const priceImpact = computed(() => trade.value?.priceImpact ?? null)

  const {
    gotAmountFor,
    gotResult: gotAmountsResult,
    gettingAmountFor,
    touch: touchAmounts,
  } = useSwapAmounts(
    computed<GetAmountsProps | null>(() => {
      const input = inputAmount.value
      if (!input) return null
      const { for: amountFor, wei: referenceValue } = input

      const tradeVal = trade.value
      if (!tradeVal) return null

      return {
        trade: tradeVal,
        amountFor,
        referenceValue,
      }
    }),
  )

  const amountsWithSlippage = computed(() =>
    match(gotAmountsResult.value)
      .with(P.not(P.nullish), ({ amountsResult, props }) => {
        const adjusted = computeSlippage(amountsResult, numberToPercent(slippageTolerance.value, SLIPPAGE_PRECISION))
        return { adjusted, props }
      })
      .otherwise(() => null),
  )

  const slippageDataParsed = useSlippageParsed({
    tokens,
    amounts: computed(() => amountsWithSlippage.value?.adjusted ?? null),
  })

  watch(
    [gotAmountFor, selection.tokens],
    ([result]) => {
      if (result) {
        const { amount, amountFor } = result
        const tokenData = selection.tokens[amountFor]
        if (tokenData) {
          debugModule('Setting computed amount for %o: %o', amountFor, amount.asBigInt)
          const raw = amount.decimals(tokenData)
          setEstimated(raw.toFixed(5) as WeiAsToken)
        }
      }
    },
    { deep: true },
  )

  const estimatedForAfterAmountsComputation = computed<null | TokenType>(() => {
    return gotAmountFor.value?.amountFor ?? null
  })

  const finalRates = useRates(
    computed(() => {
      const amounts = gotAmountsResult.value?.amountsResult
      if (!amounts) return null
      return { tokenA: amounts.amountIn, tokenB: amounts.amountOut }
    }),
  )

  // #endregion

  // #region Action

  const propsForSwap = computed<null | PropsToBuildSwapProps>(() => {
    const slipResult = amountsWithSlippage.value
    if (!slipResult) return null

    const {
      adjusted: amounts,
      props: { trade },
    } = slipResult

    return { trade, amounts, expertMode: expertMode.value }
  })

  const {
    prepare,
    prepareState,
    swapState,
    swapFee,
    swap,
    clear: clearSwap,
  } = useSwap(propsForSwap, {
    onSuccess: () => {
      tokensStore.touchUserBalance()
    },
  })

  // #endregion

  // #region validation

  const swapValidation = useSwapValidation({
    selected: reactive(buildPair((type) => computed(() => !!selection.addrs[type]))),
    amounts: selection.weiFromTokens,
    tokenABalance: computed(() => selection.balance.tokenA as Wei | null),
    trade: computed(() => tradeResult.value?.kind ?? null),
    wallet: computed(() => (dexStore.isWalletConnected ? 'connected' : 'anonymous')),
  })

  const isValid = computed(() => swapValidation.value.kind === 'ok')
  const isValidationPending = computed(() => swapValidation.value.kind === 'pending')
  const validationError = computed(() => (swapValidation.value.kind === 'err' ? swapValidation.value.err : null))

  // #endregion

  // #region etc

  const isRefreshing = logicOr(
    toRef(tokensStore, 'isBalancePending'),
    toRef(tokensStore, 'isDerivedUSDPending'),
    computed(() => !!gettingAmountFor.value),
  )

  const refresh = () => {
    tokensStore.touchUserBalance()
    tokensStore.touchDerivedUsd()
    touchAmounts()
  }

  // #endregion

  return {
    tokenValues: readonly(tokenValues),
    finalRates,
    addrs: addrsReadonly,
    tokens,
    trade,
    symbols,
    priceImpact,

    isValid,
    isValidationPending,
    validationError,

    swapState,
    prepareState,
    swapFee,
    gettingAmountFor,
    gotAmountFor,
    gotAmountsResult,
    estimatedFor: estimatedForAfterAmountsComputation,
    slippageDataParsed,

    prepare,
    swap,
    clearSwap,
    setTokenAddress,
    setToken: setMainToken,
    setBothTokens,
    resetInput,
    swapTokensWithEachOther,

    slippageTolerance,
    multihops,
    expertMode,

    isRefreshing,
    refresh,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
