<script setup lang="ts" name="ModuleStaking">
import { SButton } from '@soramitsu-ui/ui'
import BigNumber from 'bignumber.js'
import { Pool, Sorting } from './types'
import { usePoolsQuery } from './query.pools'
import { PAGE_SIZE } from './const'
import { useBlockNumber } from '../ModuleEarnShared/composable.block-number'
import { useFetchStakingRewards } from './composable.fetch-rewards'
import { tokenWeiToRaw, asWei, tokenRawToWei } from '@/core/kaikas'
import { deepClone } from '@/utils/common'

const kaikasStore = useKaikasStore()
const kaikas = kaikasStore.getKaikasAnyway()

const vBem = useBemClass()

const stakingStore = useStakingStore()
const { stakedOnly, searchQuery, sorting } = toRefs(stakingStore)

const page = ref(1)

const blockNumber = useBlockNumber(kaikas)

const PoolsQuery = usePoolsQuery(computed(() => kaikas.selfAddress))
const rawPools = computed(() => {
  return PoolsQuery.result.value?.pools ?? null
})
const rawPoolIds = computed(() => {
  if (rawPools.value === null) return null

  return rawPools.value.map((pool) => pool.id)
})

const { rewards, areRewardsFetched } = useFetchStakingRewards({
  kaikas,
  poolIds: rawPoolIds,
  updateBlockNumber: (v) => {
    blockNumber.value = v
  },
})

const showViewMore = computed(() => {
  if (sortedPools.value === null) return false

  return sortedPools.value.length > page.value * PAGE_SIZE
})

function viewMore() {
  page.value++
}

const pools = computed<Pool[] | null>(() => {
  if (rawPools.value === null || blockNumber.value === null) return null

  const pools = [] as Pool[]

  rawPools.value.forEach((pool) => {
    if (!blockNumber.value || !rawPools.value || !rewards.value) return

    const id = pool.id

    const reward = rewards.value[pool.id]
    const earned = reward
      ? new BigNumber(
          tokenWeiToRaw(
            // FIXME which decimals?
            { decimals: 18 },
            reward,
          ),
        )
      : null

    if (earned === null) return

    const stakeToken = {
      ...pool.stakeToken,
      decimals: Number(pool.stakeToken.decimals),
    }
    const rewardToken = {
      ...pool.stakeToken,
      decimals: Number(pool.stakeToken.decimals),
    }

    const staked = new BigNumber(
      tokenWeiToRaw(
        // FIXME which decimals?
        { decimals: 18 },
        asWei(pool.users[0]?.amount ?? '0'),
      ),
    )

    const annualPercentageRate = new BigNumber(0)

    const createdAtBlock = Number(pool.createdAtBlock)

    const totalTokensStaked = new BigNumber(pool.totalTokensStaked).multipliedBy(
      new BigNumber(0.1).exponentiatedBy(pool.stakeToken.decimals),
    )
    const totalStaked = totalTokensStaked // TODO: finish

    const endsIn = Number(pool.endBlock) - blockNumber.value

    pools.push({
      id,
      stakeToken,
      rewardToken,
      earned,
      staked,
      createdAtBlock,
      annualPercentageRate,
      totalStaked,
      endsIn,
    })
  })

  return pools
})

const filteredPools = computed<Pool[] | null>(() => {
  if (pools.value === null) return null

  let filteredPools = [...pools.value]

  if (stakedOnly.value) filteredPools = filteredPools?.filter((pool) => !pool.staked.isZero())

  if (searchQuery.value)
    filteredPools = filteredPools?.filter((pool) =>
      [pool.stakeToken.symbol, pool.stakeToken.name, pool.rewardToken.symbol, pool.rewardToken.name].some((item) =>
        item.toLowerCase().includes(searchQuery.value.toLowerCase()),
      ),
    )

  return filteredPools
})

// TODO move to composable
const sortedPools = computed<Pool[] | null>(() => {
  if (filteredPools.value === null) return null

  let sortedPools = [...filteredPools.value]

  sortedPools = sortedPools.sort((poolA, poolB) => {
    if (sorting.value === Sorting.AnnualPercentageRate)
      return poolB.annualPercentageRate.comparedTo(poolA.annualPercentageRate)

    if (sorting.value === Sorting.Earned) return poolB.earned.comparedTo(poolA.earned)

    if (sorting.value === Sorting.TotalStaked) return poolB.earned.comparedTo(poolA.totalStaked)

    if (sorting.value === Sorting.Latest) return poolB.createdAtBlock - poolA.createdAtBlock

    return 0
  })

  return sortedPools
})

const paginatedPools = computed<Pool[] | null>(() => {
  if (sortedPools.value === null) return null

  return sortedPools.value.slice(0, page.value * PAGE_SIZE)
})

const loading = computed(() => {
  return pools.value === null || !areRewardsFetched.value
})

function updateStaked(poolId: Pool['id'], diff: BigNumber) {
  if (!PoolsQuery.result.value) return

  const diffInWei = new BigNumber(
    tokenRawToWei(
      // FIXME which decimals?
      { decimals: 18 },
      diff.toString(),
    ),
  )
  const clonedQueryResult = deepClone(PoolsQuery.result.value)
  const pool = clonedQueryResult.pools.find((pool) => pool.id === poolId)
  if (!pool) return

  pool.totalTokensStaked = new BigNumber(pool.totalTokensStaked).plus(diffInWei).toFixed(0)

  const user = pool.users[0] ?? null
  if (!user) return

  user.amount = new BigNumber(user.amount).plus(diffInWei).toFixed(0)
  PoolsQuery.result.value = clonedQueryResult
}

function handleStaked(pool: Pool, amount: string) {
  updateStaked(pool.id, new BigNumber(amount))
}
function handleUnstaked(pool: Pool, amount: string) {
  updateStaked(pool.id, new BigNumber(0).minus(amount))
}
</script>

<template>
  <div v-bem>
    <template v-if="rawPools">
      <div v-bem="'list'">
        <ModuleStakingPool
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
        <SButton
          v-bem="'view-more-button'"
          size="sm"
          type="primary"
          :loading="loading"
          @click="viewMore"
        >
          View more
        </SButton>
      </div>
    </template>
    <div
      v-if="loading && !showViewMore"
      v-bem="'loader'"
    >
      <KlayLoader />
    </div>
  </div>
</template>

<style lang="sass">
$padding-bottom: 19px

.module-staking
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
