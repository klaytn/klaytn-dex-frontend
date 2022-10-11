<script setup lang="ts" name="ModuleFarming">
import { Pool } from './types'
import { PAGE_SIZE } from './const'
import BigNumber from 'bignumber.js'
import { WeiAsToken, WeiRaw, Address } from '@/core'
import { deepClone } from '@/utils/common'
import { or, not } from '@vueuse/core'
import { useBlockNumber } from '../ModuleEarnShared/composable.block-number'
import { useFetchFarmingRewards } from './composable.fetch-rewards'
import { useFarmingQuery } from './query.farming'
import { useLiquidityPositionsQuery } from './query.liquidity-positions'
import { usePairsAndRewardTokenQuery } from './query.pairs-and-reward-token'
import { farmingToWei } from './utils'
import { storeToRefs } from 'pinia'
import { useFilteredPools, useMappedPools, useSortedPools } from './composable.pools'

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

const poolsMapped = useMappedPools({
  farming: FarmingQuery.result,
  blockNumber,
  pairsAndRewardToken: PairsAndRewardTokenQuery.result,
  rewards,
  liquidityPositions,
})

const poolsFiltered = useFilteredPools(poolsMapped, { stakedOnly, searchQuery })

const poolsSorted = useSortedPools(poolsFiltered, sorting)

const isLoading = or(FarmingQuery.loading, LiquidityPositionsQuery.loading, PairsAndRewardTokenQuery.loading)

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

// #region Pagination

const page = ref(1)

const showViewMore = computed(() => {
  if (poolsSorted.value === null) return false
  return poolsSorted.value.length > page.value * PAGE_SIZE
})

function viewMore() {
  page.value++
}

const poolsPaginated = computed<Pool[] | null>(() => {
  if (poolsSorted.value === null) return null
  return poolsSorted.value.slice(0, page.value * PAGE_SIZE)
})

// #endregion

const poolsFinal = poolsPaginated

const expandPools = computed(() => poolsPaginated.value?.length === 1)
</script>

<template>
  <div v-bem>
    <template v-if="farming">
      <div v-bem="'list'">
        <ModuleFarmingPool
          v-for="pool in poolsFinal"
          :key="pool.id"
          :pool="pool"
          :expanded="expandPools"
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
