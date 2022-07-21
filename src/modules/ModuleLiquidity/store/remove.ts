import { Address, asWei, Token, tokenRawToWei, tokenWeiToRaw, ValueWei, WeiNumStrBn } from '@/core/kaikas'
import { LP_TOKEN_DECIMALS as LP_TOKEN_DECIMALS_VALUE } from '@/core/kaikas/const'
import { usePairAddress, usePairReserves } from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import { buildPair, TokensPair, TOKEN_TYPES } from '@/utils/pair'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'
import { roundTo } from 'round-to'
import { useRates } from '@/modules/ModuleTradeShared/composable.rates'

const LP_TOKENS_DECIMALS = Object.freeze({ decimals: LP_TOKEN_DECIMALS_VALUE })

function usePrepareSupply(props: {
  tokens: Ref<null | TokensPair<Address>>
  pairAddress: Ref<null | Address>
  liquidity: Ref<ValueWei<string> | null>
  // TODO amounts
}) {
  const kaikasStore = useKaikasStore()

  const [active, setActive] = useToggle(false)

  const isReadyToPrepareSupply = computed(
    () => !!(props.tokens.value && props.pairAddress.value && props.liquidity.value),
  )

  const scope = useScopeWithAdvancedKey(
    computed(() => {
      if (!active.value) return null

      const tokens = props.tokens.value
      const pair = props.pairAddress.value
      const liquidity = props.liquidity.value
      if (!(tokens && pair && liquidity)) return null

      return {
        key: `${pair}-${liquidity}`,
        payload: { tokens, pair, liquidity },
      }
    }),
    ({ tokens, pair, liquidity: lpTokenValue }) => {
      const { state: prepareState } = useTask(
        () =>
          kaikasStore.getKaikasAnyway().liquidity.prepareRmLiquidity({
            tokens,
            pair,
            lpTokenValue,
          }),
        { immediate: true },
      )

      usePromiseLog(prepareState, 'liquidity-remove-prepare-supply')
      useNotifyOnError(prepareState, 'Supply preparation failed')

      const { state: supplyState, run: supply } = useTask(async () => {
        const { send } = prepareState.fulfilled?.value ?? {}
        invariant(send)
        return send()
      })

      usePromiseLog(supplyState, 'liquidity-remove-supply')
      useNotifyOnError(supplyState, 'Supply failed')

      const isPrepareSupplyPending = toRef(prepareState, 'pending')
      const supplyGas = computed(() => prepareState.fulfilled?.value?.gas)
      const isSupplyReady = computed(() => !!prepareState.fulfilled)
      const isSupplyPending = toRef(supplyState, 'pending')
      const isSupplyOk = computed(() => !!supplyState.fulfilled)
      const isSupplyErr = computed(() => !!supplyState.rejected)

      return readonly({
        supplyGas,
        isPrepareSupplyPending,
        isSupplyReady,
        isSupplyPending,
        isSupplyOk,
        isSupplyErr,

        supply,
      })
    },
  )

  return {
    setActive,
    supply: () => scope.value?.expose.supply(),
    isReadyToPrepareSupply,
    isPrepareSupplyPending: computed(() => scope.value?.expose.isPrepareSupplyPending ?? false),
    supplyGas: computed(() => scope.value?.expose.supplyGas ?? null),
    isSupplyReady: computed(() => scope.value?.expose.isSupplyReady ?? false),
    isSupplyPending: computed(() => scope.value?.expose.isSupplyPending ?? false),
    isSupplyOk: computed(() => scope.value?.expose.isSupplyOk ?? false),
    isSupplyErr: computed(() => scope.value?.expose.isSupplyErr ?? false),
  }
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

  const taskScope = useScopeWithAdvancedKey(
    computed(() => {
      if (!kaikasStore.isConnected) return null
      if (!tokens.value) return null
      const pairAddr = pair.value
      const lpTokenValue = liquidity.value
      if (!pairAddr || !lpTokenValue) return null

      const key = `${pairAddr}-${lpTokenValue}`

      return {
        key,
        payload: { pair: pairAddr, lpTokenValue, tokens: tokens.value, kaikas: kaikasStore.getKaikasAnyway() },
      }
    }),
    ({ pair, lpTokenValue, tokens, kaikas }) => {
      const { state } = useTask(
        async () => {
          const { amounts } = await kaikas.liquidity.computeRmLiquidityAmounts({
            tokens,
            pair,
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
    pending: computed(() => taskScope.value?.expose.pending ?? false),
    amounts: computed(() => taskScope.value?.expose.fulfilled ?? null),
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
  const { result: pairReserves, pending: isReservesPending } = usePairReserves(selected)
  // const pair = usePairAddress(reactive(buildPair((type) => selected.value?.[type])))
  const isPairLoaded = computed(() => !!existingPair.value)

  // TODO
  const poolShare = ref(0)

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

  const {
    supplyGas,
    isReadyToPrepareSupply,
    isPrepareSupplyPending,
    isSupplyErr,
    isSupplyOk,
    isSupplyPending,
    isSupplyReady,
    supply,
    setActive: setSupplyActive,
  } = usePrepareSupply({
    tokens: selected,
    pairAddress: computed(() => existingPair.value?.addr ?? null),
    liquidity,
  })

  function prepareSupply() {
    setSupplyActive(true)
  }

  function closeSupply() {
    setSupplyActive(false)
  }

  return {
    selected,
    selectedTokensData,
    selectedTokensSymbols,

    pairUserBalance,
    pairTotalSupply,
    pairReserves,
    isReservesPending,
    isPairPending,
    isPairLoaded,
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
