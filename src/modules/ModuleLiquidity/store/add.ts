import { ValueWei, deadlineFiveMinutesFromNow, tokenWeiToRaw, Address } from '@/core/kaikas'
import { usePairAddress } from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import { syncInputAddrsWithLocalStorage, useTokensInput } from '@/modules/ModuleTradeShared/composable.tokens-input'
import { buildPair, mirrorTokenType, TokenType } from '@/utils/pair'
import { Status } from '@soramitsu-ui/ui'
import { useDanglingScope, useStaleIfErrorState, useTask, wheneverTaskSucceeds } from '@vue-kakuyaku/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import Debug from 'debug'

const debug = Debug('liquidity-add-store')

export const useLiquidityAddStore = defineStore('liquidity-add', () => {
  const kaikasStore = useKaikasStore()

  const selection = useTokensInput()
  syncInputAddrsWithLocalStorage(selection.input, 'liquidity-store-input-tokens')

  const pair = usePairAddress(selection.addrs)
  const isEmptyPair = computed(() => pair.result === 'empty')

  const quoteFor = ref<null | TokenType>(null)

  const doQuoteScope = useDanglingScope<{ pending: boolean; exchangeRate: null | ValueWei<string> }>()

  function doQuoteFor(value: ValueWei<string>, quoteFor: TokenType) {
    const kaikas = kaikasStore.getKaikasAnyway()
    invariant(pair.result === 'not-empty', 'Pair should exist')
    const { tokenA, tokenB } = selection.addrs
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

  const addLiquidityTask = useTask(async () => {
    const kaikas = kaikasStore.getKaikasAnyway()

    await kaikas.liquidity.prepareAddLiquidity({
      tokens: buildPair((type) => {
        const addr = selection.addrs[type]
        const wei = selection.wei[type]
        invariant(addr && wei, `Addr and wei value for ${type} should exist`)
        return { addr, desired: wei.input }
      }),
      deadline: deadlineFiveMinutesFromNow(),
    })
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

    if (selection.addrs.tokenA && selection.addrs.tokenB && selection.wei[token] && pair.result === 'not-empty') {
      debouncedDoQuoteFor(selection.wei[token]!.input, quoteFor.value)
    }
  }

  function setToken(token: TokenType, addr: Address) {
    selection.input[token].addr = addr
  }

  return {
    selection,
    addLiquidity: () => addLiquidityTask.run(),
    isAddLiquidityPending,
    isEmptyPair,
    pair,
    quoteForTask,

    isSubmitted,
    clearSubmittion,

    input,
    setToken,
  }
})

if (import.meta.hot) import.meta.hot?.accept(acceptHMRUpdate(useLiquidityAddStore, import.meta.hot))
