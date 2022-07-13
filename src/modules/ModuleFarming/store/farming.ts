import { Address, asWei, Kaikas } from '@/core/kaikas'
import { useLazyQuery, useQuery } from '@vue/apollo-composable'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { FARMING_CONTRACT_ADDRESS, REFETCH_FARMING_INTERVAL } from '../const'
import { Pool, Sorting } from '../types'
import invariant from 'tiny-invariant'
import { useDanglingScope } from '@vue-kakuyaku/core'
import { Ref } from 'vue'
import { deepClone } from '@/utils/common'
import { not, or } from '@vueuse/core'
import { farmingFromWei, farmingToWei } from '../utils'
import { Status } from '@soramitsu-ui/ui'
import { useFetchFarmingRewards } from '../composable.fetch-rewards'
import { useBlockNumber } from '@/modules/ModuleEarnShared/composable.block-number'
import { useFarmingQuery } from '../query.farming'
import { usePairsQuery } from '../query.pairs'
import { useLiquidityPairsQuery } from '../query.liquidity-pairs'

function useSortedPools(pools: Ref<Pool[] | null>, sort: Ref<Sorting>) {
  const sorted = computed<Pool[] | null>(() => {
    if (!pools.value) return null
    const sortValue = sort.value

    const list = [...pools.value]

    list.sort((poolA, poolB) => {
      if (sortValue === Sorting.Liquidity) return poolB.liquidity.comparedTo(poolA.liquidity)

      if (sortValue === Sorting.AnnualPercentageRate)
        return poolB.annualPercentageRate.comparedTo(poolA.annualPercentageRate)

      if (sortValue === Sorting.Multiplier) return poolB.multiplier.comparedTo(poolA.multiplier)

      if (sortValue === Sorting.Earned) return poolB.earned.comparedTo(poolA.earned)

      if (sortValue === Sorting.Latest) return poolB.createdAtBlock - poolA.createdAtBlock

      return 0
    })

    return list
  })

  return sorted
}

function setupQueries({
  kaikas,
  stakedOnly,
  searchQuery,
  sorting,
}: {
  // FIXME kaikas maybe not always available
  kaikas: Kaikas
  stakedOnly: Ref<boolean>
  searchQuery: Ref<string>
  sorting: Ref<Sorting>
}) {
  const blockNumber = useBlockNumber(kaikas)
  function updateBlockNumber(value: number) {
    blockNumber.value = value
  }

  const FarmingQuery = useFarmingQuery(kaikas.selfAddress)

  const farming = computed(() => FarmingQuery.result.value?.farming ?? null)

  const farmingPoolIds = computed(() => {
    if (farming.value === null) return null

    return farming.value.pools.map((pool) => pool.id)
  })

  const poolPairIds = computed(() => {
    return farming.value?.pools.map((pool) => pool.pair) ?? []
  })

  const pairsQueryVariables = ref<{ pairIds: Address[] }>({
    pairIds: [],
  })
  const PairsQuery = usePairsQuery(computed(() => pairsQueryVariables.value.pairIds))

  const pairs = computed(() => {
    return PairsQuery.result.value?.pairs ?? null
  })

  function handleFarmingQueryResult() {
    pairsQueryVariables.value.pairIds = poolPairIds.value

    PairsQuery.load()

    if (PairsQuery.result) PairsQuery.refetch()
  }

  // Workaround for cached results: https://github.com/vuejs/apollo/issues/1154
  if (FarmingQuery.result.value) handleFarmingQueryResult()

  FarmingQuery.onResult(() => {
    handleFarmingQueryResult()
  })

  const { rewards, areRewardsFetched } = useFetchFarmingRewards({
    kaikas,
    poolIds: farmingPoolIds,
    updateBlockNumber,
  })

  const LiquidityPositionsQuery = useLiquidityPairsQuery(kaikas.selfAddress)

  const liquidityPositions = computed(() => {
    if (!LiquidityPositionsQuery.result.value) return null
    return LiquidityPositionsQuery.result.value.user?.liquidityPositions ?? []
  })

  const pools = computed<Pool[] | null>(() => {
    if (farming.value === null || pairs.value === null || blockNumber.value === null) return null

    const pools = [] as Pool[]

    farming.value.pools.forEach((pool) => {
      if (!farming.value || !pairs.value || !blockNumber.value || !rewards.value) return

      const id = pool.id
      const pair = pairs.value.find((pair) => pair.id === pool.pair) ?? null

      const reward = rewards.value[pool.id]
      const earned = reward ? new BigNumber(farmingFromWei(reward)) : null

      if (pair === null || earned === null) return

      const pairId = pair.id
      const name = pair.name

      const staked = new BigNumber(farmingFromWei(asWei(pool.users[0]?.amount ?? '0')))

      const liquidityPosition = liquidityPositions.value?.find((position) => position.pair.id === pairId) ?? null
      const balance = new BigNumber(liquidityPosition?.liquidityTokenBalance ?? 0)

      const annualPercentageRate = new BigNumber(0)

      const reserveUSD = new BigNumber(pair.reserveUSD)
      const totalSupply = new BigNumber(pair.totalSupply)
      const totalTokensStaked = new BigNumber(farmingFromWei(asWei(pool.totalTokensStaked)))
      const liquidity = reserveUSD.dividedBy(totalSupply).multipliedBy(totalTokensStaked)

      const bonusEndBlock = Number(pool.bonusEndBlock)
      const allocPoint = new BigNumber(pool.allocPoint)
      const totalAllocPoint = new BigNumber(farming.value.totalAllocPoint)
      const bonusMultiplier = new BigNumber(pool.bonusMultiplier)
      const multiplier = allocPoint
        .dividedBy(totalAllocPoint)
        .multipliedBy(blockNumber.value < bonusEndBlock ? bonusMultiplier : 1)

      const createdAtBlock = Number(pool.createdAtBlock)

      pools.push({
        id,
        name,
        pairId,
        earned,
        staked,
        balance,
        annualPercentageRate,
        liquidity,
        multiplier,
        createdAtBlock,
      })
    })

    return pools
  })

  const filteredPools = computed<Pool[] | null>(() => {
    if (pools.value === null) return null

    let filteredPools = [...pools.value]

    if (stakedOnly.value) filteredPools = filteredPools.filter((pool) => !pool.staked.isZero())

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filteredPools = filteredPools.filter((pool) => pool.name.toLowerCase().includes(query))
    }

    return filteredPools
  })

  const sortedPools = useSortedPools(filteredPools, sorting)

  const isLoading = or(
    FarmingQuery.loading,
    LiquidityPositionsQuery.loading,
    PairsQuery.loading,
    not(areRewardsFetched),
  )

  for (const [QueryName, Query] of Object.entries({ FarmingQuery, LiquidityPositionsQuery, PairsQuery })) {
    Query.onError((param) => {
      console.error('query error', param)
      $notify({ status: Status.Error, description: `Apollo error (${QueryName}): ${String(param)}` })
    })
  }

  /**
   * FIXME use "optimistic response" API for query result replacement
   */
  function updateStaked(poolId: Pool['id'], diff: BigNumber) {
    if (!FarmingQuery.result.value) return

    const diffAsWei = asWei(new BigNumber(farmingToWei(diff.toString())))
    const farmingQueryResultCloned = deepClone(FarmingQuery.result.value)
    const pool = farmingQueryResultCloned.farming.pools.find((pool) => pool.id === poolId)
    if (!pool) return

    pool.totalTokensStaked = new BigNumber(pool.totalTokensStaked).plus(diffAsWei).toFixed(0)

    const user = pool.users[0] ?? null
    if (!user) return

    user.amount = new BigNumber(user.amount).plus(diffAsWei).toFixed(0)
    FarmingQuery.result.value = farmingQueryResultCloned
  }

  /**
   * FIXME use "optimistic response" API for query result replacement
   */
  function updateBalance(pairId: Pool['pairId'], diff: BigNumber) {
    if (!LiquidityPositionsQuery.result.value) return

    const liquidityPositionsQueryResultCloned = deepClone(LiquidityPositionsQuery.result.value)
    const liquidityPosition =
      liquidityPositionsQueryResultCloned.user.liquidityPositions.find(
        (liquidityPosition) => liquidityPosition.pair.id === pairId,
      ) ?? null
    if (!liquidityPosition) return

    liquidityPosition.liquidityTokenBalance = `${new BigNumber(liquidityPosition.liquidityTokenBalance).plus(diff)}`
    LiquidityPositionsQuery.result.value = liquidityPositionsQueryResultCloned
  }

  function handleStaked(pool: Pool, amount: string) {
    updateStaked(pool.id, new BigNumber(amount))
    updateBalance(pool.pairId, new BigNumber(0).minus(amount))
  }
  function handleUnstaked(pool: Pool, amount: string) {
    updateStaked(pool.id, new BigNumber(0).minus(amount))
    updateBalance(pool.pairId, new BigNumber(amount))
  }

  return reactive({
    sortedPools,
    filteredPools,
    pools,

    liquidityPositions,
    rewards,
    pairs,
    farming,
    farmingPoolIds,

    blockNumber,

    handleStaked,
    handleUnstaked,

    isLoading,
  })
}

export const useFarmingStore = defineStore('farming', () => {
  const kaikasStore = useKaikasStore()

  const stakedOnly = ref(false)
  const searchQuery = ref('')
  const sorting = ref<Sorting>(Sorting.Default)

  const queryScope = useDanglingScope<ReturnType<typeof setupQueries>>()

  function setupQueriesScope() {
    const kaikas = kaikasStore.getKaikasAnyway()
    queryScope.setup(() => setupQueries({ kaikas, searchQuery, stakedOnly, sorting }))
  }

  function useQueryScopeAnyway() {
    const setup = queryScope.scope.value?.setup
    invariant(setup)
    return setup
  }

  return { setupQueries: setupQueriesScope, useQueryScopeAnyway, stakedOnly, searchQuery, sorting }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
