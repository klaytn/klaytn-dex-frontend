import { ValueWei, deadlineFiveMinutesFromNow, tokenWeiToRaw, Address, asWei } from '@/core/kaikas'
import {
  usePairAddress,
  PairAddressResult,
  usePairBalance,
  usePairReserves,
} from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import { useTokensInput, TokenInputWei } from '@/modules/ModuleTradeShared/composable.tokens-input'
import { buildPair, mirrorTokenType, TokensPair, TokenType } from '@/utils/pair'
import { Status } from '@soramitsu-ui/ui'
import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'
import BN from 'bn.js'
import { useRates } from '@/modules/ModuleTradeShared/composable.rates'

function useQuoting(props: {
  pair: Ref<null | PairAddressResult>
  quoteFor: Ref<null | TokenType>
  wei: TokensPair<null | TokenInputWei>
}): {
  pendingFor: Ref<null | TokenType>
  exchangeRate: Ref<null | { quoteFor: TokenType; value: ValueWei<string> }>
  touch: () => void
} {
  const kaikasStore = useKaikasStore()

  const scope = useParamScope(
    computed(() => {
      if (props.pair.value?.kind !== 'exist') return null
      const { tokens, addr: pair } = props.pair.value

      const quoteFor = props.quoteFor.value
      if (!quoteFor) return null

      const quoteFrom = mirrorTokenType(quoteFor)
      const value = props.wei[quoteFrom]?.input
      if (!value) return null

      return {
        key: `${pair}-${quoteFor}-${value}`,
        payload: { tokens, quoteFor, quoteFrom, value },
      }
    }),
    ({ tokens: { tokenA, tokenB }, quoteFor, value }) => {
      const { state, run } = useTask(
        () =>
          kaikasStore
            .getKaikasAnyway()
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
      payload: { quoteFor },
      expose: {
        state: { fulfilled },
      },
    } = scope.value
    if (!fulfilled) return null
    return { quoteFor, value: fulfilled.exchangeRate }
  })
  const touch = () => scope.value?.expose.run()

  return { pendingFor, exchangeRate, touch }
}

function usePrepareSupply(props: { tokens: TokensPair<TokenInputWei | null>; onSupply: () => void }) {
  const kaikasStore = useKaikasStore()
  const tokensStore = useTokensStore()

  const [active, setActive] = useToggle(false)

  const scope = useParamScope(
    computed(() => {
      const {
        tokens: { tokenA, tokenB },
      } = props

      return (
        active.value &&
        tokenA &&
        tokenB && {
          key: `${tokenA.addr}-${tokenA.input}-${tokenB.addr}-${tokenB.input}`,
          payload: { tokenA, tokenB },
        }
      )
    }),
    (tokens) => {
      const { state: statePrepare, run: runPrepare } = useTask(
        async () => {
          const kaikas = kaikasStore.getKaikasAnyway()
          const { send, gas } = await kaikas.liquidity.prepareAddLiquidity({
            tokens: buildPair((type) => ({ addr: tokens[type].addr, desired: tokens[type].input })),
            deadline: deadlineFiveMinutesFromNow(),
          })
          return { send, gas }
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
      useNotifyOnError(statePrepare, 'Preparation failed')
      useNotifyOnError(stateSupply, 'Liquidity addition failed')
      wheneverFulfilled(stateSupply, () => {
        tokensStore.touchUserBalance()
        props.onSupply()
        $notify({ status: Status.Success, description: 'Liquidity addition succeeded!' })
      })

      const supplyGas = computed(() => statePrepare.fulfilled?.value.gas ?? null)
      const statePrepareFlags = promiseStateToFlags(statePrepare)
      const stateSupplyFlags = promiseStateToFlags(stateSupply)

      return readonly({
        prepare,
        supplyGas,
        prepareState: statePrepareFlags,
        supplyState: stateSupplyFlags,
        supply,
      })
    },
  )

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
  const selection = useTokensInput({ localStorageKey: 'liquidity-add-selection' })
  const symbols = computed(() => buildPair((type) => selection.tokens[type]?.symbol ?? null))
  const addrsReadonly = readonly(selection.addrsWritable)

  const { pair: gotPair } = usePairAddress(addrsReadonly)
  const isEmptyPair = computed(() => gotPair.value?.kind === 'empty')
  const { result: pairBalance, touch: touchPairBalance } = usePairBalance(
    addrsReadonly,
    computed(() => gotPair.value?.kind === 'exist'),
  )
  const { result: pairReserves, touch: touchPairReserves } = usePairReserves(addrsReadonly)
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

  const quoteFor = ref<null | TokenType>(null)

  const {
    pendingFor: isQuotePendingFor,
    exchangeRate: quoteExchangeRate,
    touch: touchQuote,
  } = useQuoting({
    pair: gotPair,
    quoteFor,
    wei: selection.wei,
  })

  watch(
    [quoteExchangeRate, selection.tokens],
    ([rate, tokens]) => {
      if (rate && tokens[rate.quoteFor]) {
        selection.input[rate.quoteFor].inputRaw = tokenWeiToRaw(tokens[rate.quoteFor]!, rate.value)
      }
    },
    { immediate: true, deep: true },
  )

  const rates = useRates(
    computed(() => {
      if (!selection.wei.tokenA || !selection.wei.tokenB) return null
      if (!quoteExchangeRate.value) return null
      return buildPair((type) => {
        const wei = selection.wei[type]!.input
        const bn = asWei(new BN(wei))
        return bn
      })
    }),
  )

  const {
    prepare: prepareSupply,
    clear: clearSupply,
    scope: supplyScope,
  } = usePrepareSupply({
    tokens: selection.wei,
    onSupply() {
      touchPairBalance()
      touchPairReserves()
      touchQuote()
    },
  })
  const isValid = computed(() => !!rates.value)

  function input(token: TokenType, raw: string) {
    selection.input[token].inputRaw = raw
    quoteFor.value = mirrorTokenType(token)
  }

  function setToken(token: TokenType, addr: Address) {
    selection.input[token].addr = addr
  }

  function setBoth(tokens: TokensPair<Address>) {
    selection.resetInput(buildPair((type) => ({ addr: tokens[type], inputRaw: '' })))
  }

  return {
    selection,
    symbols,
    isEmptyPair,
    pair: gotPair,
    pairUserBalance,
    pairTotalSupply,
    poolShare,
    formattedPoolShare,
    pairReserves,

    rates,

    isQuotePendingFor,
    quoteExchangeRate,

    input,
    setToken,
    setBoth,

    prepareSupply,
    clearSupply,
    supplyScope,
    isValid,
  }
})

if (import.meta.hot) import.meta.hot?.accept(acceptHMRUpdate(useLiquidityAddStore, import.meta.hot))
