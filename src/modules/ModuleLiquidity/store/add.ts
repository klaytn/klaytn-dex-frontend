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
      const { state } = useTask(
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
      usePromiseLog(state, 'rm-liquidity-quoting')

      return flattenState(state)
    },
  )

  const pendingFor = computed(() => (scope.value?.expose.pending ? scope.value.payload.quoteFor : null))
  const exchangeRate = computed(() => {
    if (!scope.value) return null
    const {
      payload: { quoteFor },
      expose: { fulfilled },
    } = scope.value
    if (!fulfilled) return null
    return { quoteFor, value: fulfilled.exchangeRate }
  })

  return { pendingFor, exchangeRate }
}

function usePrepareSupply(props: { tokens: TokensPair<TokenInputWei | null> }) {
  const kaikasStore = useKaikasStore()

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
      const { state: statePrepare } = useTask(
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

      const { state: stateSupply, run: supply } = useTask(async () => {
        invariant(statePrepare.fulfilled)
        await statePrepare.fulfilled.value.send()
      })

      usePromiseLog(statePrepare, 'add-liquidity-prepare')
      usePromiseLog(stateSupply, 'add-liquidity-supply')
      useNotifyOnError(stateSupply, 'Preparation failed')
      useNotifyOnError(stateSupply, 'Liquidity addition failed')
      wheneverFulfilled(stateSupply, () => {
        $notify({ status: Status.Success, description: 'Liquidity addition succeeded!' })
      })

      const supplyGas = computed(() => statePrepare.fulfilled?.value.gas ?? null)
      const statePrepareFlags = promiseStateToFlags(statePrepare)
      const stateSupplyFlags = promiseStateToFlags(stateSupply)

      return readonly({
        supplyGas,
        prepareState: statePrepareFlags,
        supplyState: stateSupplyFlags,
        supply,
      })
    },
  )

  return {
    activate: () => setActive(true),
    reset: () => setActive(false),
    scope: computed(() => scope.value?.expose),
  }
}

export const useLiquidityAddStore = defineStore('liquidity-add', () => {
  const selection = useTokensInput()
  const symbols = computed(() => buildPair((type) => selection.tokens[type]?.symbol ?? null))
  const addrsReadonly = readonly(selection.addrsWritable)

  const { pair: gotPair } = usePairAddress(addrsReadonly)
  const isEmptyPair = computed(() => gotPair.value?.kind === 'empty')
  const { result: pairBalance } = usePairBalance(
    addrsReadonly,
    computed(() => gotPair.value?.kind === 'exist'),
  )
  const { result: pairReserves } = usePairReserves(addrsReadonly)
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

  const { pendingFor: isQuotePendingFor, exchangeRate: quoteExchangeRate } = useQuoting({
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
    activate: activateSupply,
    reset: resetSupply,
    scope: supplyScope,
  } = usePrepareSupply({ tokens: selection.wei })

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

    activateSupply,
    resetSupply,
    supplyScope,
  }
})

if (import.meta.hot) import.meta.hot?.accept(acceptHMRUpdate(useLiquidityAddStore, import.meta.hot))
