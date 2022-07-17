import { Address, asWei, tokenRawToWei, tokenWeiToRaw, ValueWei, WeiNumStrBn } from '@/core/kaikas'
import { LP_TOKEN_DECIMALS as LP_TOKEN_DECIMALS_VALUE } from '@/core/kaikas/const'
import { usePairAddress } from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import { buildPair, TokensPair } from '@/utils/pair'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { acceptHMRUpdate, defineStore } from 'pinia'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'

const LP_TOKENS_DECIMALS = Object.freeze({ decimals: LP_TOKEN_DECIMALS_VALUE })

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
  const selected = ref<null | TokensPair<Address>>(null)

  const tokensStore = useTokensStore()
  const selectedTokensData = reactive(
    buildPair((type) => computed(() => selected.value && tokensStore.findTokenData(selected.value[type]))),
  )

  const { pair, pending: isPairPending } = usePairAddress(reactive(buildPair((type) => selected.value?.[type])))
  const existingPair = computed(() => (pair.value?.kind === 'exist' ? pair.value : null))
  const pairTotalSupply = computed(() => existingPair.value?.totalSupply)
  const pairUserBalance = computed(() => existingPair.value?.userBalance)

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
      const wei = liquidity.value
      const total = pairUserBalance.value
      if (!wei || !total) return null
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

  function setTokens(tokens: TokensPair<Address>) {
    selected.value = tokens
  }

  const supplyScope = useDeferredScope<{
    pending: boolean
    ready: null | {
      gas: number
      send: () => void
    }
  }>()

  const kaikasStore = useKaikasStore()
  function prepareSupply() {
    const { tokenA, tokenB } = selected.value ?? {}
    const pairAddr = existingPair.value?.addr
    const lpTokenValue = liquidity.value
    invariant(tokenA && tokenB && lpTokenValue && pairAddr)

    supplyScope.setup(() => {
      const { state } = useTask(
        () => {
          return kaikasStore.getKaikasAnyway().liquidity.prepareRmLiquidity({
            tokens: { tokenA, tokenB },
            pair: pairAddr,
            lpTokenValue,
          })
        },
        { immediate: true },
      )

      useNotifyOnError(state, 'Supply preparation failed')
      wheneverRejected(state, () => supplyScope.dispose())

      const { pending, fulfilled: ready } = toRefs(flattenState(state))

      return reactive({ pending, ready })
    })
  }

  return {
    selected,
    selectedTokensData,

    pairUserBalance,
    pairTotalSupply,
    isPairPending,

    liquidity,
    liquidityRaw,
    liquidityRelative,
    amounts,
    isAmountsPending,

    setTokens,
    prepareSupply,
  }
})

if (import.meta.hot) acceptHMRUpdate(useLiquidityRmStore, import.meta.hot)
