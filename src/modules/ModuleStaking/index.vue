<script setup lang="ts" name="ModuleStaking">
import { SButton } from '@soramitsu-ui/ui'
import { Pool } from './types'
import { usePoolsQuery } from './query.pools'
import { useTokensQuery } from '@/query/tokens-derived-usd'
import {
  PAGE_SIZE,
  POLL_INTERVAL,
  POLL_INTERVAL_QUICK,
  POLL_INTERVAL_QUICK_TIMEOUT,
  REFETCH_TOKENS_INTERVAL,
} from './const'
import { useBlockNumber } from '../ModuleEarnShared/composable.block-number'
import { useFetchStakingRewards } from './composable.fetch-rewards'
import { Address } from '@/core'
import { useFilteredPools, useMappedPools, useSortedPools } from './composable.pools'

const dexStore = useDexStore()

const stakingStore = useStakingStore()
const { stakedOnly, searchQuery, sorting } = toRefs(stakingStore)

const page = ref(1)

const blockNumber = useBlockNumber(computed(() => dexStore.anyDex.dex().agent))

const quickPoll = refAutoReset(false, POLL_INTERVAL_QUICK_TIMEOUT)
const pollInterval = computed(() => {
  return (quickPoll.value && POLL_INTERVAL_QUICK) || POLL_INTERVAL
})

const PoolsQuery = usePoolsQuery(toRef(dexStore, 'account'), pollInterval)
const pools = computed(() => {
  return PoolsQuery.result.value?.pools ?? null
})
const poolIds = computed(() => {
  if (pools.value === null) return null

  return pools.value.map((pool) => pool.id)
})

const stakeAndRewardTokenIds = computed(() => {
  if (!pools.value) return null
  return Array.from(
    new Set(
      pools.value.reduce((accumulator, pool) => {
        accumulator.push(pool.stakeToken.id)
        accumulator.push(pool.rewardToken.id)
        return accumulator
      }, [] as Address[]),
    ),
  )
})

const TokensQuery = useTokensQuery(
  computed(() => stakeAndRewardTokenIds.value || []),
  {
    pollInterval: REFETCH_TOKENS_INTERVAL,
  },
)
const tokens = computed(() => {
  return TokensQuery.result.value?.tokens ?? null
})

function handlePoolsQueryResult() {
  TokensQuery.load()

  if (TokensQuery.result) TokensQuery.refetch()
}
PoolsQuery.onResult(() => {
  handlePoolsQueryResult()
})
// Workaround for cached results: https://github.com/vuejs/apollo/issues/1154
if (PoolsQuery.result.value) handlePoolsQueryResult()

const { rewards } = useFetchStakingRewards({
  poolIds,
  updateBlockNumber: (v) => {
    blockNumber.value = v
  },
  pollInterval,
})

const showViewMore = computed(() => {
  if (poolsSorted.value === null) return false

  return poolsSorted.value.length > page.value * PAGE_SIZE
})

function viewMore() {
  page.value++
}

const poolsMapped = useMappedPools({
  pools: PoolsQuery.result,
  rewards,
  tokens,
  blockNumber,
})

const poolsFiltered = useFilteredPools(poolsMapped, { stakedOnly, searchQuery })

const poolsSorted = useSortedPools(poolsFiltered, sorting)

const poolsPaginated = computed<Pool[] | null>(() => {
  if (poolsSorted.value === null) return null
  return poolsSorted.value.slice(0, page.value * PAGE_SIZE)
})

const poolsFinal = poolsPaginated

const isLoading = computed(() => !poolsFinal.value)

function handleStakedUnstaked() {
  quickPoll.value = true
}
</script>

<template>
  <div
    :class="$style.moduleStaking"
    class="flex-1 flex flex-col"
  >
    <div
      v-if="!poolsFinal?.length && !isLoading"
      :class="$style.empty"
      class="flex-1 flex items-center justify-center"
    >
      {{
        !pools?.length
          ? 'There are no staking pools at the moment'
          : 'There are no staking pools match the current filter'
      }}
    </div>
    <template v-if="poolsFinal?.length">
      <div
        :class="$style.list"
        class="flex-1 flex flex-col"
      >
        <ModuleStakingPool
          v-for="pool in poolsFinal"
          :key="pool.id"
          :pool="pool"
          :block-number="blockNumber"
          @staked="handleStakedUnstaked"
          @unstaked="handleStakedUnstaked"
        />
      </div>
      <div
        v-if="showViewMore"
        :class="$style.viewMore"
        class="flex justify-center w-full py-2"
      >
        <SButton
          size="sm"
          type="primary"
          :loading="isLoading"
          @click="viewMore"
        >
          View more
        </SButton>
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
