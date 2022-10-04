<script setup lang="ts" name="ModuleFarming">
import { PercentageRate, Pool, TokenPriceInUSD } from './types'
import { BLOCKS_PER_YEAR, PAGE_SIZE } from './const'
import BigNumber from 'bignumber.js'
import { WeiAsToken, Wei, WeiRaw, Address } from '@/core'
import { deepClone } from '@/utils/common'
import { or, not } from '@vueuse/core'
import { useBlockNumber } from '../ModuleEarnShared/composable.block-number'
import { useFetchFarmingRewards } from './composable.fetch-rewards'
import { useFarmingQuery } from './query.farming'
import { useLiquidityPositionsQuery } from './query.liquidity-positions'
import { usePairsAndRewardTokenQuery } from './query.pairs-and-reward-token'
import { farmingFromWei, farmingToWei } from './utils'
import { storeToRefs } from 'pinia'
import { useSortedPools } from './composable.sorted-pools'

const vBem = useBemClass()

const dexStore = useDexStore()

const farmingStore = useFarmingStore()
const { sorting, searchQuery, stakedOnly } = storeToRefs(farmingStore)

const { notify } = useNotify()

const blockNumber = useBlockNumber(computed(() => dexStore.anyDex.dex().agent))
function updateBlockNumber(value: number) {
  blockNumber.value = value
}

const FarmingQuery = useFarmingQuery(toRef(dexStore, 'account'))

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
const PairsAndRewardTokenQuery = usePairsAndRewardTokenQuery(
  computed(() => pairsAndRewardTokenQueryVariables.value.pairIds),
)

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
  poolIds: farmingPoolIds,
  updateBlockNumber,
})

const LiquidityPositionsQuery = useLiquidityPositionsQuery(toRef(dexStore, 'account'))

const liquidityPositions = computed(() => {
  if (!LiquidityPositionsQuery.result.value) return null
  return LiquidityPositionsQuery.result.value.user?.liquidityPositions ?? []
})

const pools = computed<Pool[] | null>(() => {
  if (farming.value === null || pairs.value === null || blockNumber.value === null || rewardToken.value === null)
    return null

  let pools = [] as Pool[]

  farming.value.pools.forEach((pool) => {
    if (!farming.value || !pairs.value || !blockNumber.value || !rewards.value) return

    const id = pool.id
    const pair = pairs.value.find((pair) => pair.id === pool.pair) ?? null

    const reward = rewards.value.get(pool.id)
    const earned = reward ? farmingFromWei(reward) : null

    if (pair === null || earned === null) return

    const pairId = pair.id
    const name = pair.name

    const staked = farmingFromWei(new Wei(pool.users[0]?.amount ?? '0'))

    const liquidityPosition = liquidityPositions.value?.find((position) => position.pair.id === pairId) ?? null
    const balance = new BigNumber(liquidityPosition?.liquidityTokenBalance ?? 0) as WeiAsToken<BigNumber>

    const reserveUSD = new BigNumber(pair.reserveUSD)
    const totalSupply = new BigNumber(pair.totalSupply)
    const totalTokensStaked = new BigNumber(farmingFromWei(new Wei(pool.totalTokensStaked)))
    const stakeTokenPrice = reserveUSD.dividedBy(totalSupply) as TokenPriceInUSD
    const liquidity = reserveUSD.dividedBy(totalSupply).multipliedBy(totalTokensStaked) as WeiAsToken<BigNumber>

    const annualPercentageRate = new BigNumber(0) as PercentageRate

    const totalLpRewardPricePerYear = new BigNumber(pair.dayData[0].volumeUSD).times(365)
    const lpAnnualPercentageRate = (
      !liquidity.isZero() ? totalLpRewardPricePerYear.div(liquidity).times(100) : new BigNumber(0)
    ) as PercentageRate

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

  const sumOfMultipliers = pools.reduce((acc, pool) => acc.plus(pool.multiplier), new BigNumber(0))

  pools = pools.map((pool) => {
    if (!farming.value || !rewardToken.value) return pool
    const farmingRewardRate = new BigNumber(farmingFromWei(new Wei(farming.value.rewardRate)))
    const poolRewardRate = farmingRewardRate.times(pool.multiplier.div(sumOfMultipliers))
    const totalRewardPricePerYear = poolRewardRate.times(BLOCKS_PER_YEAR).times(rewardToken.value.derivedUSD)
    const annualPercentageRate = (
      !pool.liquidity.isZero() ? totalRewardPricePerYear.div(pool.liquidity).times(100) : new BigNumber(0)
    ) as PercentageRate
    return {
      ...pool,
      annualPercentageRate,
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

for (const [QueryName, Query] of Object.entries({
  FarmingQuery,
  LiquidityPositionsQuery,
  PairsAndRewardTokenQuery,
})) {
  Query.onError((param) => {
    console.error('query error', param)
    notify({ type: 'err', description: `Apollo error (${QueryName}): ${String(param)}` })
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

const page = ref(1)

const showViewMore = computed(() => {
  if (sortedPools.value === null) return false

  return sortedPools.value.length > page.value * PAGE_SIZE
})

function viewMore() {
  page.value++
}

const paginatedPools = computed<Pool[] | null>(() => {
  if (sortedPools.value === null) return null

  return sortedPools.value.slice(0, page.value * PAGE_SIZE)
})
</script>

<template>
  <div v-bem>
    <template v-if="farming">
      <div v-bem="'list'">
        <ModuleFarmingPool
          v-for="pool in paginatedPools"
          :key="pool.id"
          :pool="pool"
          @staked="(value: string) => handleStaked(pool, value)"
          @unstaked="(value: string) => handleUnstaked(pool, value)"
        />
      </div>
      <div
        v-if="showViewMore"
        v-bem="'view-more'"
      >
        <KlayButton
          v-bem="'view-more-button'"
          size="sm"
          type="primary"
          :loading="isLoading"
          @click="viewMore"
        >
          View more
        </KlayButton>
      </div>
    </template>
    <div
      v-if="isLoading && !showViewMore"
      v-bem="'loader'"
    >
      <KlayLoader />
    </div>
  </div>
</template>

<style lang="sass">
$padding-bottom: 19px

.module-farming
  flex: 1
  display: flex
  flex-direction: column
  padding-bottom: $padding-bottom
  &__view-more
    display: flex
    justify-content: center
    width: 100%
    padding: 8px 0
    margin-bottom: - $padding-bottom
  &__loader
    flex: 1
    display: flex
    justify-content: center
    align-items: center
    min-height: 82px + $padding-bottom
    margin-bottom: - $padding-bottom
</style>
