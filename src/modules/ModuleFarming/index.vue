<script setup lang="ts" name="ModuleFarming">
import { Pool } from './types'
import { PAGE_SIZE } from './const'
import { asWei, Address } from '@/core/kaikas'
import { deepClone } from '@/utils/common'
import { Status } from '@soramitsu-ui/ui'
import { or, not } from '@vueuse/core'
import BigNumber from 'bignumber.js'
import { useBlockNumber } from '../ModuleEarnShared/composable.block-number'
import { useFetchFarmingRewards } from './composable.fetch-rewards'
import { useSortedPools } from './composable.sort-pools'
import { useFarmingQuery } from './query.farming'
import { useLiquidityPairsQuery } from './query.liquidity-pairs'
import { usePairsQuery } from './query.pairs'
import { farmingFromWei, farmingToWei } from './utils'
import { storeToRefs } from 'pinia'

const vBem = useBemClass()

const kaikasStore = useKaikasStore()
const kaikas = kaikasStore.getKaikasAnyway()

const farmingStore = useFarmingStore()
const { stakedOnly, searchQuery, sorting } = storeToRefs(farmingStore)

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

const isLoading = or(FarmingQuery.loading, LiquidityPositionsQuery.loading, PairsQuery.loading, not(areRewardsFetched))

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
