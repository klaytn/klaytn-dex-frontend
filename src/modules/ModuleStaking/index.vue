<script setup lang="ts" name="ModuleStaking">
import { SButton } from '@soramitsu-ui/ui'
import BigNumber from 'bignumber.js'
import { Pool, Sorting } from './types'
import { usePoolsQuery } from './query.pools'
import { useTokensQuery } from '@/query/tokens-derived-usd'
import { PAGE_SIZE, BLOCKS_PER_YEAR, REFETCH_TOKENS_INTERVAL } from './const'
import { useBlockNumber } from '../ModuleEarnShared/composable.block-number'
import { TokenPriceInUSD, AmountInUSD, PercentageRate } from '../ModuleEarnShared/types'
import { useFetchStakingRewards } from './composable.fetch-rewards'
import { Wei, WeiAsToken, WeiRaw, Address } from '@/core'
import { deepClone } from '@/utils/common'

const dexStore = useDexStore()

const vBem = useBemClass()

const stakingStore = useStakingStore()
const { stakedOnly, searchQuery, sorting } = toRefs(stakingStore)

const page = ref(1)

const blockNumber = useBlockNumber(computed(() => dexStore.anyDex.dex().agent))

const PoolsQuery = usePoolsQuery(toRef(dexStore, 'account'))
const rawPools = computed(() => {
  return PoolsQuery.result.value?.pools ?? null
})
const rawPoolIds = computed(() => {
  if (rawPools.value === null) return null

  return rawPools.value.map((pool) => pool.id)
})

const stakeAndRewardTokenIds = computed(() => {
  if (!rawPools.value) return null
  return Array.from(
    new Set(
      rawPools.value.reduce((accumulator, pool) => {
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

const { rewards, areRewardsFetched } = useFetchStakingRewards({
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

const pools = computed((): Pool[] | null => {
  const rawPoolsValue = rawPools.value
  const rewardsValue = rewards.value
  const tokensValue = tokens.value

  if (!rawPoolsValue || !rewardsValue || !tokensValue) return null

  const pools = [] as Pool[]

  for (const pool of rawPoolsValue) {
    const id = pool.id

    const reward = rewardsValue.get(pool.id)
    const earned = reward ? reward.decimals(pool.rewardToken) : null

    if (earned === null) continue

    const stakeToken = {
      ...pool.stakeToken,
      decimals: Number(pool.stakeToken.decimals),
    }
    const rewardToken = {
      ...pool.rewardToken,
      decimals: Number(pool.rewardToken.decimals),
    }

    const staked = new Wei(pool.users[0]?.amount ?? '0').decimals(pool.stakeToken)

    const stakeTokenFromTokensQuery = tokensValue.find((token) => token.id === pool.stakeToken.id)
    const rewardTokenFromTokensQuery = tokensValue.find((token) => token.id === pool.rewardToken.id)

    if (!stakeTokenFromTokensQuery || !rewardTokenFromTokensQuery) continue

    const stakeTokenPrice = new BigNumber(stakeTokenFromTokensQuery.derivedUSD) as TokenPriceInUSD
    const rewardTokenPrice = new BigNumber(stakeTokenFromTokensQuery.derivedUSD) as TokenPriceInUSD

    const totalTokensStaked = new Wei(pool.totalTokensStaked).decimals(stakeToken)
    const totalStaked = stakeTokenPrice.times(totalTokensStaked) as AmountInUSD

    const rewardRate = new BigNumber(pool.rewardRate)
    const totalRewardPricePerYear = rewardRate.times(BLOCKS_PER_YEAR).times(rewardTokenPrice)
    const annualPercentageRate = (
      !totalStaked.isZero() ? totalRewardPricePerYear.div(totalStaked).times(100) : new BigNumber(0)
    ) as PercentageRate

    const createdAtBlock = Number(pool.createdAtBlock)

    pools.push({
      id,
      stakeToken,
      rewardToken,
      earned,
      staked,
      stakeTokenPrice,
      createdAtBlock,
      annualPercentageRate,
      totalStaked,
      endBlock: Number(pool.endBlock),
    })
  }

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

  const clonedQueryResult = deepClone(PoolsQuery.result.value)
  const pool = clonedQueryResult.pools.find((pool) => pool.id === poolId)
  if (!pool) return

  const diffInWei = Wei.fromToken(pool.stakeToken, diff.toFixed() as WeiAsToken)

  pool.totalTokensStaked = new BigNumber(pool.totalTokensStaked).plus(diffInWei.asBigNum).toFixed(0) as WeiRaw<string>

  const user = pool.users[0] ?? null
  if (!user) return

  user.amount = new BigNumber(user.amount).plus(diffInWei.asBigNum).toFixed(0) as WeiRaw<string>
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
          :block-number="blockNumber"
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
