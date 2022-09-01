import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { Address, TokenSymbol, WeiAsToken } from '@/core'
import { Wei, Route, Token, Pair, TokenAmount } from '@/core/kaikas/entities'
import BigNumber from 'bignumber.js'
import { TokenType, TokensPair, mirrorTokenType, buildPair } from '@/utils/pair'
import Debug from 'debug'
import { useGetAmount, GetAmountProps } from '../composable.get-amount'
import { useSwapRoute } from '../composable.swap-route'
import { usePairAddress } from '../../ModuleTradeShared/composable.pair-by-tokens'
import { useSwapValidation } from '../composable.validation'
import { buildSwapProps, TokenAddrAndWeiInput } from '../util.swap-props'
import { useExchangeRateInput, useInertExchangeRateInput } from '../../ModuleTradeShared/composable.exchange-rate-input'
import { Ref } from 'vue'
import { useRates } from '@/modules/ModuleTradeShared/composable.rates'
import { usePriceImpact } from '@/modules/ModuleSwap/composable.price-impact'
import { useTokenAmounts } from '@/modules/ModuleSwap/composable.token-amount'
import { RouteName } from '@/types'
import { usePairsQuery } from '../query.pairs'
import { LP_TOKEN_DECIMALS } from '@/core/kaikas/const'

const debugModule = Debug('swap-store')

type NormalizedWeiInput = TokensPair<TokenAddrAndWeiInput> & { route: Route; amountFor: TokenType }

function useSwap(input: Ref<null | NormalizedWeiInput>) {
  const dexStore = useDexStore()
  const tokensStore = useTokensStore()
  const { notify } = useNotify()

  const [active, setActive] = useToggle(false)

  const swapKey = computed(() => {
    if (!input.value) return null
    const { route, tokenA, tokenB, amountFor } = input.value
    return {
      key: `${tokenA.addr}-${tokenA.input}-${tokenB.addr}-${tokenB.input}-${amountFor}`,
      payload: { route, tokenA, tokenB, amountFor },
    }
  })
  watch(swapKey, () => setActive(false))

  const scope = useParamScope(
    computed(
      () =>
        active.value &&
        swapKey.value &&
        dexStore.active.kind === 'named' && {
          key: `${dexStore.active.wallet}-${swapKey.value.key}`,
          payload: { props: swapKey.value.payload, dex: dexStore.active.dex() },
        },
    ),
    ({ props: { route, tokenA, tokenB, amountFor }, dex }) => {
      const { state: prepareState, run: prepare } = useTask(
        async () => {
          // 1. Approve amount of the tokenA
          await dex.agent.approveAmount(tokenA.addr, tokenA.input)

          // 2. Perform swap according to which token is "exact" and if
          // some of them is native
          const swapProps = buildSwapProps({ route, tokenA, tokenB, referenceToken: mirrorTokenType(amountFor) })
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
    },
  )

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
  const pageRoute = useRoute()
  const isActiveRoute = computed(() => pageRoute.name === RouteName.Swap)

  const selection = useExchangeRateInput({ localStorageKey: 'swap-selection', isActive: isActiveRoute })
  const selectionInput = useInertExchangeRateInput({ input: selection.input })
  const { rates: inputRates } = selectionInput
  const { tokens, resetInput } = selection
  const addrsReadonly = readonly(selection.addrs)

  const symbols = computed(() => buildPair((type) => tokens[type]?.symbol ?? null))

  const PairsQuery = usePairsQuery()

  const pairs = computed(() => {
    return (
      PairsQuery.result.value?.pairs.map((pair) => {
        const token0 = new Token({
          address: pair.token0.id,
          decimals: Number(pair.token0.decimals),
          symbol: pair.token0.symbol,
        })
        const token1 = new Token({
          address: pair.token1.id,
          decimals: Number(pair.token1.decimals),
          symbol: pair.token1.symbol,
        })
        const pairSymbol = (token0.symbol + '-' + token1.symbol) as TokenSymbol
        return new Pair({
          address: pair.id,
          decimals: LP_TOKEN_DECIMALS,
          symbol: pairSymbol,
          name: pairSymbol,
          token0Amount: new TokenAmount(token0, pair.reserve0),
          token1Amount: new TokenAmount(token1, pair.reserve1),
        })
      }) ?? null
    )
  })

  const inputToken = computed(() => (tokens.tokenA ? new Token(tokens.tokenA) : null))
  const outputToken = computed(() => (tokens.tokenB ? new Token(tokens.tokenB) : null))

  const amountFor = computed(() => selectionInput.exchangeRateFor.value)

  const swapRoute = useSwapRoute({
    pairs,
    inputToken,
    outputToken,
    amountInWei: computed(() => selection.inputNormalized.value?.wei ?? null),
    amountFor,
  })
  const route = computed(() => (swapRoute.value?.kind === 'exist' ? swapRoute.value.route : null))

  const { pair: pairAddrResult } = usePairAddress(addrsReadonly)
  const { result: pairBalance } = usePairBalance(
    addrsReadonly,
    computed(() => pairAddrResult.value?.kind === 'exist'),
  )
  const poolShare = computed(() => pairBalance.value?.poolShare ?? null)
  const formattedPoolShare = useFormattedPercent(poolShare, 7)

  const { gotAmountFor, gettingAmountFor } = useGetAmount(
    computed<GetAmountProps | null>(() => {
      if (!amountFor.value) return null

      const referenceValue = selection.inputNormalized.value?.wei
      if (!referenceValue || referenceValue.asBigInt <= 0) return null

      if (!route.value) return null

      if (pairAddrResult.value?.kind !== 'exist') return null

      return {
        route: route.value,
        amountFor: amountFor.value,
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
          selectionInput.setEstimated(new BigNumber(raw).toFixed(5) as WeiAsToken)
        }
      }
    },
    { deep: true },
  )

  const normalizedWeiInputs = computed<NormalizedWeiInput | null>(() => {
    if (gotAmountFor.value) {
      const {
        amount,
        props: { amountFor, referenceValue, route },
      } = gotAmountFor.value
      return {
        ...buildPair((type) => ({
          addr: type === 'tokenA' ? route.input.address : route.output.address,
          input: amountFor === type ? amount : referenceValue,
        })),
        route,
        amountFor,
      }
    }
    return null
  })

  const rates = useRates(
    computed(() => {
      const wei = normalizedWeiInputs.value
      if (!wei) return null
      return buildPair((type) => wei[type].input)
    }),
  )

  const tokenAmounts = useTokenAmounts({
    inputToken,
    outputToken,
    inputAmountInWei: computed(() => normalizedWeiInputs.value?.tokenA.input ?? null),
    outputAmountInWei: computed(() => normalizedWeiInputs.value?.tokenB.input ?? null),
  })

  const priceImpact = usePriceImpact({
    route,
    inputAmount: computed(() => tokenAmounts.value?.inputAmount ?? null),
    outputAmount: computed(() => tokenAmounts.value?.outputAmount ?? null),
  })

  const swapValidation = useSwapValidation({
    tokenA: computed(() => {
      const balance = selection.balance.tokenA as Wei | null
      const token = selection.tokens.tokenA
      const input = normalizedWeiInputs.value?.tokenA?.input

      return balance && token && input ? { ...token, balance, input } : null
    }),
    tokenB: computed(() => selection.tokens.tokenB),
    route: swapRoute,
  })

  const isValid = computed(() => swapValidation.value.kind === 'ok')
  const validationMessage = computed(() => (swapValidation.value.kind === 'err' ? swapValidation.value.message : null))

  const { prepare, prepareState, swapState, swapFee, swap, clear: clearSwap } = useSwap(normalizedWeiInputs)

  function setToken(type: TokenType, addr: Address | null) {
    selection.addrs[type] = addr
  }

  function setBothTokens(pair: TokensPair<Address>) {
    selection.setAddrs(pair)
    selection.input.value = null
  }

  function setTokenValue(type: TokenType, value: WeiAsToken) {
    selectionInput.set(type, value)
  }

  return {
    inputRates,
    rates,
    addrs: addrsReadonly,
    normalizedWeiInputs,
    tokens,
    route,
    symbols,
    priceImpact,

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

    setToken,
    setTokenValue,
    setBothTokens,
    resetInput,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
