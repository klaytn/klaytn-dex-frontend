import { Address, asWei, Token, tokenRawToWei, tokenWeiToRaw, ValueWei, WeiNumStrBn } from '@/core/kaikas'
import { LP_TOKEN_DECIMALS as LP_TOKEN_DECIMALS_VALUE } from '@/core/kaikas/const'
import { usePairAddress, usePairReserves } from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import { buildPair, TokensPair, TOKEN_TYPES } from '@/utils/pair'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'
import { computeRates, roundRates } from '@/utils/common'
import { MaybeRef } from '@vueuse/core'
import { roundTo } from 'round-to'

const LP_TOKENS_DECIMALS = Object.freeze({ decimals: LP_TOKEN_DECIMALS_VALUE })

function useRates(amounts: MaybeRef<null | TokensPair<ValueWei<BN>>>) {
  return computed(() => {
    const { tokenA, tokenB } = unref(amounts) || {}
    if (!tokenB || !tokenA) return null
    const rates = computeRates({ tokenA, tokenB })
    return roundRates(rates)
  })
}

function useRemoveAmounts(
  tokens: Ref<null | TokensPair<Address>>,
  pair: Ref<null | Address>,
  liquidity: Ref<null | WeiNumStrBn>,
): {
  pending: Ref<boolean>
  amounts: Ref<null | TokensPair<ValueWei<BN>>>
} {
  const kaikasStore = useKaikasStore()

  const taskScope = useComputedScope(
    computed(() => {
      if (!tokens.value) return null
      const pairAddr = pair.value
      const lpTokenValue = liquidity.value
      if (!pairAddr || !lpTokenValue) return null

      const key = `${pairAddr}-${lpTokenValue}`

      return key
    }),
    () => {
      const { state } = useTask(
        async () => {
          const kaikas = kaikasStore.getKaikasAnyway()
          invariant(tokens.value)
          const { tokenA, tokenB } = tokens.value
          const pairAddr = pair.value
          const lpTokenValue = liquidity.value
          invariant(pairAddr && lpTokenValue)

          const { amounts } = await kaikas.liquidity.computeRmLiquidityAmounts({
            tokens: { tokenA, tokenB },
            pair: pairAddr,
            lpTokenValue,
          })
          return amounts
        },
        { immediate: true },
      )

      usePromiseLog(state, 'compute-remove-liquidity-amounts')

      return flattenState(state)
    },
  )

  return {
    pending: computed(() => taskScope.value?.setup.pending ?? false),
    amounts: computed(() => taskScope.value?.setup.fulfilled ?? null),
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

  const { pair, pending: isPairPending } = usePairAddress(reactive(buildPair((type) => selected.value?.[type])))
  const existingPair = computed(() => (pair.value?.kind === 'exist' ? pair.value : null))
  const pairTotalSupply = computed(() => existingPair.value?.totalSupply)
  const pairUserBalance = computed(() => existingPair.value?.userBalance)
  const pairReserves = usePairReserves(selected)

  const poolShare = computed(() => {
    const total = unref(pairTotalSupply)
    const user = unref(pairUserBalance)
    if (!total || !user) return null
    return new BigNumber(user).div(total).toNumber()
  })
  const formattedPoolShare = computed(() => {
    const value = poolShare.value
    if (!value) return null
    return `${roundTo(value * 100, 7)}%`
  })

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

  const { amounts, pending: isAmountsPending } = useRemoveAmounts(
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

  const isReadyToPrepareSupply = computed(() => {
    return !!(selected.value && liquidity.value && pair.pair?.addr)
  })

  const prepareSupplyScope = useDeferredScope<{
    pending: boolean
    ready: null | {
      gas: number
      send: () => Promise<void>
    }
  }>()

  const kaikasStore = useKaikasStore()
  function prepareSupply() {
    prepareSupplyScope.setup(() => {
      const task = useTask(() => {
        invariant(isReadyToPrepareSupply.value)
        const pairAddr = pair.pair?.addr
        const lpTokenValue = liquidity.value!

        return kaikasStore.getKaikasAnyway().liquidity.prepareRmLiquidity({
          tokens: selected.value!,
          pair: pairAddr!,
          lpTokenValue,
        })
      })
      task.run()
      useNotifyOnError(task, 'Supply preparation failed')

      const pending = computed(() => task.state.kind === 'pending')
      const ready = computed(() => (task.state.kind === 'ok' ? task.state.data : null))

      return reactive({ pending, ready })
    })
  }

  const isPrepareSupplyPending = computed(() => prepareSupplyScope.scope.value?.setup.pending ?? false)
  const isSupplyReady = computed(() => !!prepareSupplyScope.scope.value?.setup.ready)
  const supplyGas = computed(() => prepareSupplyScope.scope.value?.setup.ready?.gas ?? null)

  const supplyScope = useScope(isSupplyReady, () => {
    const { send } = prepareSupplyScope.scope.value!.setup.ready!

    const task = useTask(send)

    const pending = computed(() => task.state.kind === 'pending')
    const ok = computed(() => task.state.kind === 'ok')
    const err = computed(() => task.state.kind === 'err')

    wheneverTaskSucceeds(task, () => {
      pair.touch()
    })

    const { run } = task

    return reactive({ pending, ok, err, run })
  })

  const isSupplyPending = computed(() => supplyScope.value?.setup.pending ?? false)
  const isSupplyOk = computed(() => supplyScope.value?.setup.ok ?? false)
  const isSupplyErr = computed(() => supplyScope.value?.setup.err ?? false)

  function supply() {
    supplyScope.value?.setup.run()
  }

  function closeSupply() {
    prepareSupplyScope.dispose()
  }

  return {
    selected,
    selectedTokensData,
    selectedTokensSymbols,

    pairUserBalance,
    pairTotalSupply,
    pairReserves,
    isPairPending,
    poolShare,
    formattedPoolShare,

    liquidity,
    liquidityRaw,
    liquidityRelative,
    amounts,
    rates,
    isAmountsPending,

    isReadyToPrepareSupply,
    isPrepareSupplyPending,
    supplyGas,
    isSupplyReady,
    isSupplyPending,
    isSupplyErr,
    isSupplyOk,

    setTokens,
    prepareSupply,
    setLiquidityToMax,
    clear,
    supply,
    closeSupply,
  }
})

if (import.meta.hot) acceptHMRUpdate(useLiquidityRmStore, import.meta.hot)
