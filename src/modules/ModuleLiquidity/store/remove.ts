import { Address, asWei, tokenRawToWei, tokenWeiToRaw, ValueWei, WeiNumStrBn } from '@/core/kaikas'
import { LP_TOKEN_DECIMALS as LP_TOKEN_DECIMALS_VALUE } from '@/core/kaikas/const'
import { usePairAddress } from '@/modules/ModuleTradeShared/composable.pair-by-tokens'
import { buildPair, TokensPair } from '@/utils/pair'
import { useDanglingScope, useScope, useTask, wheneverTaskErrors } from '@vue-kakuyaku/core'
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

  const taskScope = useScope(
    computed(() => {
      if (!tokens.value) return null
      const pairAddr = pair.value
      const lpTokenValue = liquidity.value
      if (!pairAddr || !lpTokenValue) return null

      const key = `${pairAddr}-${lpTokenValue}`

      return key
    }),
    () => {
      async function computeAmounts() {
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
      }

      const task = useTask(computeAmounts)
      useTaskLog(task, 'compute-remove-liquidity-amounts')

      const pending = computed(() => task.state.kind === 'pending')
      const amounts = computed(() => (task.state.kind === 'ok' ? task.state.data : null))

      return reactive({ pending, amounts })
    },
  )

  return {
    pending: computed(() => taskScope.value?.setup.pending ?? false),
    amounts: computed(() => taskScope.value?.setup.amounts ?? null),
  }
}

export const useLiquidityRmStore = defineStore('liquidity-remove', () => {
  const selected = ref<null | TokensPair<Address>>(null)

  const tokensStore = useTokensStore()
  const selectedTokensData = reactive(
    buildPair((type) => computed(() => selected.value && tokensStore.findTokenData(selected.value[type]))),
  )

  const pair = usePairAddress(reactive(buildPair((type) => selected.value?.[type])))
  const isPairPending = toRef(pair, 'pending')
  const pairTotalSupply = computed(() => pair.pair?.totalSupply)
  const pairUserBalance = computed(() => pair.pair?.userBalance)

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
    computed(() => pair.pair?.addr ?? null),
    liquidity,
  )

  function setTokens(tokens: TokensPair<Address>) {
    selected.value = tokens
  }

  const supplyScope = useDanglingScope<{
    pending: boolean
    ready: null | {
      gas: number
      send: () => void
    }
  }>()

  const kaikasStore = useKaikasStore()
  function prepareSupply() {
    supplyScope.setup(() => {
      const task = useTask(() => {
        invariant(selected.value)
        const pairAddr = pair.pair?.addr
        const lpTokenValue = liquidity.value
        invariant(lpTokenValue && pairAddr)

        return kaikasStore.getKaikasAnyway().liquidity.prepareRmLiquidity({
          tokens: selected.value,
          pair: pairAddr,
          lpTokenValue,
        })
      })
      task.run()
      useNotifyOnError(task, 'Supply preparation failed')
      wheneverTaskErrors(task, () => supplyScope.dispose())

      const pending = computed(() => task.state.kind === 'pending')
      const ready = computed(() => (task.state.kind === 'ok' ? task.state.data : null))

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
