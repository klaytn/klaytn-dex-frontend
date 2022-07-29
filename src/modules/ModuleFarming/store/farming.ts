import { Address, Wei, Kaikas, WeiAsToken, WeiRaw } from '@/core/kaikas'
import BigNumber from 'bignumber.js'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { BLOCKS_PER_YEAR } from '../const'
import { Pool, Sorting } from '../types'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'
import { deepClone } from '@/utils/common'
import { not, or } from '@vueuse/core'
import { farmingFromWei, farmingToWei } from '../utils'
import { Status } from '@soramitsu-ui/ui'
import { useFetchFarmingRewards } from '../composable.fetch-rewards'
import { useBlockNumber } from '@/modules/ModuleEarnShared/composable.block-number'
import { useFarmingQuery } from '../query.farming'
import { usePairsAndRewardTokenQuery } from '../query.pairs-and-reward-token'
import { useLiquidityPositionsQuery } from '../query.liquidity-positions'

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

  const pairsAndRewardTokenQueryVariables = ref<{ pairIds: Address[] }>({
    pairIds: [],
  })
  const PairsAndRewardTokenQuery = usePairsAndRewardTokenQuery(computed(() => pairsAndRewardTokenQueryVariables.value.pairIds))

  const pairs = computed(() => {
    return PairsAndRewardTokenQuery.result.value?.pairs ?? null
  })

  const rewardToken = computed(() => {
    return PairsAndRewardTokenQuery.result.value?.token ?? null
  })

  function handleFarmingQueryResult() {
    pairsAndRewardTokenQueryVariables.value.pairIds = poolPairIds.value

    PairsAndRewardTokenQuery.load()

    if (PairsAndRewardTokenQuery.result) PairsAndRewardTokenQuery.refetch()
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

  const LiquidityPositionsQuery = useLiquidityPositionsQuery(kaikas.selfAddress)

  const liquidityPositions = computed(() => {
    if (!LiquidityPositionsQuery.result.value) return null
    return LiquidityPositionsQuery.result.value.user?.liquidityPositions ?? []
  })

  const pools = computed<Pool[] | null>(() => {
    if (farming.value === null || pairs.value === null || blockNumber.value === null || rewardToken.value === null) return null

    let pools = [] as Pool[]

    farming.value.pools.forEach((pool) => {
      if (!farming.value || !pairs.value || !blockNumber.value || !rewards.value) return

      const id = pool.id
      const pair = pairs.value.find((pair) => pair.id === pool.pair) ?? null

      const reward = rewards.value[pool.id]
      const earned = reward ? new BigNumber(farmingFromWei(reward)) : null

      if (pair === null || earned === null) return

      const pairId = pair.id
      const name = pair.name

      const staked = new BigNumber(farmingFromWei(new Wei(pool.users[0]?.amount ?? '0')))

      const liquidityPosition = liquidityPositions.value?.find((position) => position.pair.id === pairId) ?? null
      const balance = new BigNumber(liquidityPosition?.liquidityTokenBalance ?? 0)

      const reserveUSD = new BigNumber(pair.reserveUSD)
      const totalSupply = new BigNumber(pair.totalSupply)
      const totalTokensStaked = new BigNumber(farmingFromWei(new Wei(pool.totalTokensStaked)))
      const stakeTokenPrice = reserveUSD.dividedBy(totalSupply)
      const liquidity = reserveUSD.dividedBy(totalSupply).multipliedBy(totalTokensStaked)

      const annualPercentageRate = new BigNumber(0)
    
      const totalLpRewardPricePerYear = new BigNumber(pair.dayData[0].volumeUSD).times(365)
      const lpAnnualPercentageRate = !liquidity.isZero() ? totalLpRewardPricePerYear.div(liquidity).times(100) : new BigNumber(0)

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
        lpAnnualPercentageRate,
        stakeTokenPrice,
        liquidity,
        multiplier,
        createdAtBlock,
      })
    })

    const sumOfMultipliers = pools.reduce(
      (acc, pool) => acc.plus(pool.multiplier),
      new BigNumber(0)
    );

    pools = pools.map(pool => {
      if (!farming.value || !rewardToken.value) return pool
      const farmingRewardRate = new BigNumber(farmingFromWei(new Wei(farming.value.rewardRate)))
      const poolRewardRate = farmingRewardRate.times(pool.multiplier.div(sumOfMultipliers))
      const totalRewardPricePerYear = poolRewardRate.times(BLOCKS_PER_YEAR).times(rewardToken.value.derivedUSD)
      const annualPercentageRate = !pool.liquidity.isZero() ? totalRewardPricePerYear.div(pool.liquidity).times(100) : new BigNumber(0)
      return {
        ...pool,
        annualPercentageRate
      }
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
    PairsAndRewardTokenQuery.loading,
    not(areRewardsFetched),
  )

  for (const [QueryName, Query] of Object.entries({ FarmingQuery, LiquidityPositionsQuery, PairsAndRewardTokenQuery })) {
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

    const diffAsWei = farmingToWei(diff.toFixed() as WeiAsToken)
    const farmingQueryResultCloned = deepClone(FarmingQuery.result.value)
    const pool = farmingQueryResultCloned.farming.pools.find((pool) => pool.id === poolId)
    if (!pool) return

    pool.totalTokensStaked = new BigNumber(pool.totalTokensStaked).plus(diffAsWei.asBigNum).toFixed(0) as WeiRaw<string>

    const user = pool.users[0] ?? null
    if (!user) return

    user.amount = new BigNumber(user.amount).plus(diffAsWei.asBigNum).toFixed(0) as WeiRaw<string>
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

  const queryScope = useDeferredScope<ReturnType<typeof setupQueries>>()

  function setupQueriesScope() {
    const kaikas = kaikasStore.getKaikasAnyway()
    queryScope.setup(() => setupQueries({ kaikas, searchQuery, stakedOnly, sorting }))
  }

  function useQueryScopeAnyway() {
    const setup = queryScope.scope.value?.expose
    invariant(setup)
    return setup
  }

  return { setupQueries: setupQueriesScope, useQueryScopeAnyway, stakedOnly, searchQuery, sorting }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSwapStore, import.meta.hot))
