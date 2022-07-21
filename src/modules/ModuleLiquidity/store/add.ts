import { ValueWei, deadlineFiveMinutesFromNow, tokenWeiToRaw, Address, asWei } from '@/core/kaikas'
import { usePairAddress, usePairReserves } from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import { useTokensInput } from '@/modules/ModuleTradeShared/composable.tokens-input'
import { buildPair, mirrorTokenType, TokensPair, TokenType } from '@/utils/pair'
import { Status } from '@soramitsu-ui/ui'
import { useDanglingScope, useStaleIfErrorState, useTask, wheneverTaskSucceeds } from '@vue-kakuyaku/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import Debug from 'debug'
import { useRates } from '@/modules/ModuleTradeShared/composable.rates'
import BN from 'bn.js'

const debug = Debug('liquidity-add-store')

export const useLiquidityAddStore = defineStore('liquidity-add', () => {
  const kaikasStore = useKaikasStore()

  const selection = useTokensInput({ localStorageKey: 'liquidity-store-input' })
  const { tokens: selectionTokens } = selection
  const selectionTokensSymbols = computed(() => {
    if (!selectionTokens.tokenA || !selectionTokens.tokenB) return null
    return buildPair((type) => selectionTokens[type]!.symbol)
  })

  const addrsReadonly = readonly(selection.addrsWritable)

  const pair = usePairAddress(addrsReadonly)
  const isEmptyPair = computed(() => pair.result === 'empty')
  const { poolShare } = toRefs(pair)
  const formattedPoolShare = useFormattedPercent(poolShare, 7)

  const pairReserves = usePairReserves(addrsReadonly)

  const quoteFor = ref<null | TokenType>(null)

  const doQuoteScope = useDanglingScope<{ pending: boolean; exchangeRate: null | ValueWei<string> }>()

  function doQuoteFor(value: ValueWei<string>, quoteFor: TokenType) {
    const kaikas = kaikasStore.getKaikasAnyway()
    invariant(pair.result === 'not-empty', 'Pair should exist')
    const { tokenA, tokenB } = addrsReadonly
    invariant(tokenA && tokenB)

    doQuoteScope.setup(() => {
      const task = useTask(() =>
        kaikas.tokens.getTokenQuote({
          tokenA,
          tokenB,
          value,
          quoteFor,
        }),
      )

      task.run()

      const pending = computed(() => task.state.kind === 'pending')
      const exchangeRate = computed(() => (task.state.kind === 'ok' ? task.state.data : null))

      return reactive({ pending, exchangeRate })
    })
  }
  const debouncedDoQuoteFor = useDebounceFn(doQuoteFor, 700)

  const quoteForTask = computed(() => {
    const task = doQuoteScope.scope.value?.setup
    if (task) {
      invariant(quoteFor.value)
      return {
        quoteFor: quoteFor.value,
        pending: task.pending,
        completed: !!task.exchangeRate,
      }
    }
    return null
  })

  const quoteTaskKey = computed<null | string>(() => {
    const addr = pair.pair?.addr
    if (!addr) return null

    const quote = quoteFor.value
    if (!quote) return null

    const value = selection.wei[mirrorTokenType(quote)]?.input
    if (!value) return null

    return `${addr}-${quote}-${value}`
  })

  watch(
    quoteTaskKey,
    (key) => {
      debug('quote task key:', key)
      doQuoteScope.dispose()
      if (key) {
        debouncedDoQuoteFor(selection.wei[mirrorTokenType(quoteFor.value!)]!.input, quoteFor.value!)
      }
    },
    { immediate: true, deep: true },
  )

  watch(
    [() => doQuoteScope.scope.value?.setup.exchangeRate ?? null, selection.tokens],
    ([rate]) => {
      debug('exchange rate watch', rate)
      if (rate) {
        invariant(quoteFor.value)
        const tokenData = selection.tokens[quoteFor.value]
        if (tokenData) {
          selection.input[quoteFor.value].inputRaw = tokenWeiToRaw(tokenData, rate)
        }
      }
    },
    { immediate: true, deep: true },
  )

  const rates = useRates(
    computed(() => {
      if (!selection.wei.tokenA || !selection.wei.tokenB) return null
      if (!quoteForTask.value?.completed) return null
      return buildPair((type) => {
        const wei = selection.wei[type]!.input
        const bn = asWei(new BN(wei))
        return bn
      })
    }),
  )

  const addLiquidityTask = useTask(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()

    const { send } = await kaikas.liquidity.prepareAddLiquidity({
      tokens: buildPair((type) => {
        const addr = addrsReadonly[type]
        const wei = selection.wei[type]
        invariant(addr && wei, `Addr and wei value for ${type} should exist`)
        return { addr, desired: wei.input }
      }),
      deadline: deadlineFiveMinutesFromNow(),
    })

    // TODO show confirmation first!
    await send()
  })
  useTaskLog(addLiquidityTask, 'add-liquidity')
  useNotifyOnError(addLiquidityTask, 'Add liquidity failed')
  wheneverTaskSucceeds(addLiquidityTask, () => {
    $notify({ status: Status.Success, description: 'Add liquidity ok!' })
  })
  const { pending: isAddLiquidityPending, result } = toRefs(useStaleIfErrorState(addLiquidityTask))

  const isSubmitted = computed(() => !!result.value)
  function clearSubmittion() {
    result.value = null
  }

  function input(token: TokenType, raw: string) {
    selection.input[token].inputRaw = raw
    quoteFor.value = mirrorTokenType(token)

    if (addrsReadonly.tokenA && addrsReadonly.tokenB && selection.wei[token] && pair.result === 'not-empty') {
      debouncedDoQuoteFor(selection.wei[token]!.input, quoteFor.value)
    }
  }

  function setToken(token: TokenType, addr: Address) {
    selection.input[token].addr = addr
  }

  function setBoth(tokens: TokensPair<Address>) {
    selection.resetInput(buildPair((type) => ({ addr: tokens[type], inputRaw: '' })))
  }

  return {
    selection,
    selectionTokensSymbols,
    isAddLiquidityPending,
    isEmptyPair,
    pair,
    poolShare,
    formattedPoolShare,
    quoteForTask,
    rates,
    pairReserves,

    isSubmitted,

    clearSubmittion,
    addLiquidity: () => addLiquidityTask.run(),
    input,
    setToken,
    setBoth,
  }
})

if (import.meta.hot) import.meta.hot?.accept(acceptHMRUpdate(useLiquidityAddStore, import.meta.hot))
