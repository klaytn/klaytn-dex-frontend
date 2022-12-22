<script setup lang="ts" name="ModuleFarming">
import { Pool } from './types'
import { PAGE_SIZE } from './const'
import { Address } from '@/core'
import { useBlockNumber } from '../ModuleEarnShared/composable.block-number'
import { useFetchFarmingRewards } from './composable.fetch-rewards'
import { useFarmingQuery } from './query.farming'
import { usePairsAndRewardTokenQuery } from './query.pairs-and-reward-token'
import { storeToRefs } from 'pinia'
import { useFilteredPools, useMappedPools, useSortedPools } from './composable.pools'
import { POLL_INTERVAL, POLL_INTERVAL_QUICK } from './const'

const vBem = useBemClass()

const dexStore = useDexStore()

const farmingStore = useFarmingStore()
const { sorting, searchQuery, stakedOnly } = storeToRefs(farmingStore)

const { notify } = useNotify()

const blockNumber = useBlockNumber(computed(() => dexStore.anyDex.dex().agent))
function updateBlockNumber(value: number) {
  blockNumber.value = value
}

const quickPoll = refAutoReset(false, 10_000)
const pollInterval = computed(() => {
  return (quickPoll.value && POLL_INTERVAL_QUICK) || POLL_INTERVAL
})

const FarmingQuery = useFarmingQuery(toRef(dexStore, 'account'), pollInterval)

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

const { rewards } = useFetchFarmingRewards({
  poolIds: farmingPoolIds,
  updateBlockNumber,
  pollInterval,
})

const poolsMapped = useMappedPools({
  farming: FarmingQuery.result,
  blockNumber,
  pairsAndRewardToken: PairsAndRewardTokenQuery.result,
  rewards,
})

const poolsFiltered = useFilteredPools(poolsMapped, { stakedOnly, searchQuery })

const poolsSorted = useSortedPools(poolsFiltered, sorting)

const isLoading = logicOr(FarmingQuery.loading, PairsAndRewardTokenQuery.loading)

for (const [QueryName, Query] of Object.entries({
  FarmingQuery,
  PairsAndRewardTokenQuery,
})) {
  Query.onError((param) => {
    console.error('query error', param)
    notify({ type: 'err', description: `Apollo error (${QueryName}): ${String(param)}` })
  })
}

function handleStakedUnstaked() {
  quickPoll.value = true
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
  <div
    :class="$style.moduleFarming"
    class="flex-1 flex flex-col"
  >
    <div
      v-if="!poolsFinal?.length && !isLoading"
      :class="$style.empty"
      class="flex-1 flex items-center justify-center"
    >
      <template v-if="farming?.pools.length">
        There are no farming pools match the current filter
      </template>
      <template v-else>
        There are no farming pools at the moment
      </template>
    </div>
    <template v-if="poolsFinal?.length">
      <div
        :class="$style.list"
        class="flex-1 flex flex-col"
      >
        <ModuleFarmingPool
          v-for="pool in poolsFinal"
          :key="pool.id"
          :pool="pool"
          :expanded="expandPools"
          @staked="handleStakedUnstaked"
          @unstaked="handleStakedUnstaked"
        />
      </div>
      <div
        v-if="showViewMore"
        :class="$style.viewMore"
        class="flex justify-center w-full py-2"
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
      :class="$style.loader"
      class="flex-1 flex justify-center items-center"
    >
      <KlayLoader />
    </div>
  </div>
</template>

<style lang="scss" module>
@use '@/styles/vars';

$padding-bottom: 19px;

.module-staking {
  padding-bottom: $padding-bottom;
}

.view-more {
  margin-bottom: -$padding-bottom;
}

.loader {
  min-height: 82px + $padding-bottom;
  margin-bottom: -$padding-bottom;
}

.empty {
  color: vars.$gray3;
}
</style>
