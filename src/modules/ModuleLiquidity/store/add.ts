import { ValueWei, deadlineFiveMinutesFromNow, tokenWeiToRaw, Address } from '@/core/kaikas'
import { PairAddressResult, usePairAddress } from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import {
  syncInputAddrsWithLocalStorage,
  TokenInputWei,
  useTokensInput,
} from '@/modules/ModuleTradeShared/composable.tokens-input'
import { buildPair, mirrorTokenType, TokensPair, TokenType } from '@/utils/pair'
import { Status } from '@soramitsu-ui/ui'
import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
// import Debug from 'debug'
import { Ref } from 'vue'

// const debug = Debug('liquidity-add-store')

function useQuoting(props: {
  pair: Ref<null | PairAddressResult>
  quoteFor: Ref<null | TokenType>
  wei: TokensPair<null | TokenInputWei>
}): {
  pendingFor: Ref<null | TokenType>
  exchangeRate: Ref<null | { quoteFor: TokenType; value: ValueWei<string> }>
} {
  const kaikasStore = useKaikasStore()

  const scope = useScopeWithAdvancedKey(
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

export const useLiquidityAddStore = defineStore('liquidity-add', () => {
  const kaikasStore = useKaikasStore()

  const selection = useTokensInput()
  syncInputAddrsWithLocalStorage(selection.input, 'liquidity-store-input-tokens')

  const { pair: gotPair } = usePairAddress(selection.addrs)
  const isEmptyPair = computed(() => gotPair.value?.kind === 'empty')

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

  const {
    state: addLiquidityState,
    clear: clearSubmittion,
    run: addLiquidity,
  } = useTask(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()

    const { send } = await kaikas.liquidity.prepareAddLiquidity({
      tokens: buildPair((type) => {
        const addr = selection.addrs[type]
        const wei = selection.wei[type]
        invariant(addr && wei, `Addr and wei value for ${type} should exist`)
        return { addr, desired: wei.input }
      }),
      deadline: deadlineFiveMinutesFromNow(),
    })

    // TODO show confirmation first!
    await send()
  })
  usePromiseLog(addLiquidityState, 'add-liquidity')
  useNotifyOnError(addLiquidityState, 'Add liquidity failed')
  wheneverFulfilled(addLiquidityState, () => {
    $notify({ status: Status.Success, description: 'Add liquidity ok!' })
  })
  const { pending: isAddLiquidityPending, fulfilled } = toRefs(addLiquidityState)
  const isSubmitted = computed(() => !!fulfilled.value)

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
    addLiquidity,
    isAddLiquidityPending,
    isEmptyPair,
    pair: gotPair,
    isQuotePendingFor,

    isSubmitted,
    clearSubmittion,

    input,
    setToken,
    setBoth,
  }
})

if (import.meta.hot) import.meta.hot?.accept(acceptHMRUpdate(useLiquidityAddStore, import.meta.hot))
