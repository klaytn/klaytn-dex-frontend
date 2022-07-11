<script setup lang="ts" name="StakingModule">
import { useQuery } from '@vue/apollo-composable'
import type { Pausable } from '@vueuse/core'
import { SButton } from '@soramitsu-ui/ui'
import isEqual from 'lodash/fp/isEqual'

import {
  PoolsQueryResult,
  Pool,
  Rewards,
  Sorting
} from './types'
import {
  poolsQuery,
  multicallContractAddress,
  refetchPoolsInterval,
  refetchRewardsInterval,
  pageSize
} from './const'
import { AbiItem } from 'caver-js'
import stakingAbi from '@/utils/smartcontracts/staking.json'
import multicallAbi from '@/utils/smartcontracts/multicall.json'
import { useConfigWithConnectedKaikas } from '@/utils/kaikas/config'
import { Multicall } from '@/types/typechain/farming/MultiCall.sol'

const { caver } = window
const config = useConfigWithConnectedKaikas()

const vBem = useBemClass()

const stakingStore = useStakingStore()
const { stakedOnly, searchQuery, sorting } = toRefs(stakingStore)

const page = ref(1)
const rewards = ref<Rewards>({})
const blockNumber = ref<number | null>(null)
const intervals: Record<'rewards' | 'blockNumber', Pausable | null> = {
  rewards: null,
  blockNumber: null,
}

const MulticallContract = config.createContract<Multicall>(multicallContractAddress, multicallAbi.abi as AbiItem[])

const PoolsQuery = useQuery<PoolsQueryResult>(
  poolsQuery,
  {},
  {
    clientId: 'staking',
    pollInterval: refetchPoolsInterval
  }
)

const rawPools = computed(() => {
  return PoolsQuery.result.value?.pools ?? null
})

const rawPoolIds = computed(() => {
  if (rawPools.value === null)
    return null

  return rawPools.value.map(pool => pool.id)
})

async function fetchBlockNumber() {
  blockNumber.value = await caver.klay.getBlockNumber()

  if (intervals.blockNumber === null)
    intervals.blockNumber = useIntervalFn(() => {
      if (blockNumber.value === null)
        return

      blockNumber.value += 1
    }, 1000)
}

onBeforeUnmount(() => {
  intervals.blockNumber?.pause()
})

fetchBlockNumber()

async function fetchRewards(poolIds?: Pool['id'][]) {
  let ids = poolIds

  if (!ids)
    if (rawPoolIds.value === null)
      throw new Error('There are no pools for an unknown reason')
    else
      ids = rawPoolIds.value

  const abiItem = stakingAbi.abi.find(item => item.name === 'pendingReward') as AbiItem

  const calls = ids.map(poolId => {
    return [
      poolId,
      caver.klay.abi.encodeFunctionCall(abiItem, [
        config.address
      ])
    ] as [string, string]
  })

  const result = await MulticallContract.methods.aggregate(calls).call()

  const newRewards: Rewards = {}

  result.returnData.forEach((hexString, index) => {
    if (!ids) return
    const poolId = ids[index]
    newRewards[poolId] = $kaikas.utils.fromWei(caver.klay.abi.decodeParameter('uint256', hexString))
  })

  blockNumber.value = Number(result.blockNumber)

  rewards.value = {
    ...rewards.value,
    ...newRewards
  }
}

const showViewMore = computed(() => {
  if (sortedPools.value === null)
    return false

  return sortedPools.value.length > (page.value * pageSize)
})

async function viewMore() {
  page.value++
}

const pools = computed<Pool[] | null>(() => {
  if (rawPools.value === null || blockNumber.value === null)
    return null

  const pools = [] as Pool[]

  rawPools.value.forEach(pool => {
    if (rawPools.value === null || blockNumber.value === null)
      return

    const id = pool.id

    const reward = rewards.value[pool.id]
    const earned = reward ? $kaikas.bigNumber(reward) : null

    if (earned === null)
      return 

    const stakeToken = {
      ...pool.stakeToken,
      decimals: Number(pool.stakeToken.decimals)
    }
    const rewardToken = {
      ...pool.stakeToken,
      decimals: Number(pool.stakeToken.decimals)
    }

    const staked = $kaikas.bigNumber($kaikas.fromWei('0')) // TODO: finish

    const annualPercentageRate = $kaikas.bigNumber(0)

    const createdAtBlock = Number(pool.createdAtBlock)

    const totalStaked = $kaikas.bigNumber(pool.totalTokensStaked) // TODO: finish

    const endsIn = Number(pool.lastRewardBlock) - blockNumber.value

    pools.push({
      id,
      stakeToken,
      rewardToken,
      earned,
      staked,
      createdAtBlock,
      annualPercentageRate,
      totalStaked,
      endsIn
    })
  })

  return pools
})

const filteredPools = computed<Pool[] | null>(() => {
  if (pools.value === null)
    return null

  let filteredPools = [ ...pools.value ]

  if (stakedOnly.value)
    filteredPools = filteredPools?.filter(pool => pool.staked.comparedTo(0) !== 0)

  // if (searchQuery.value)
  //   filteredPools = filteredPools?.filter(pool => pool.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
  // TODO: finish

  return filteredPools
})

const sortedPools = computed<Pool[] | null>(() => {
  if (filteredPools.value === null)
    return null

  let sortedPools = [ ...filteredPools.value ]

  sortedPools = sortedPools.sort((poolA, poolB) => {
    // if (sorting.value === Sorting.Liquidity)
    //   return poolB.liquidity.comparedTo(poolA.liquidity)
    // TODO: finish

    if (sorting.value === Sorting.AnnualPercentageRate)
      return poolB.annualPercentageRate.comparedTo(poolA.annualPercentageRate)

    // if (sorting.value === Sorting.Multiplier)
    //   return poolB.multiplier.comparedTo(poolA.multiplier)
    // TODO: finish

    if (sorting.value === Sorting.Earned)
      return poolB.earned.comparedTo(poolA.earned)

    if (sorting.value === Sorting.Latest)
      return poolB.createdAtBlock - poolA.createdAtBlock

    return 0
  })
  
  return sortedPools
})

const paginatedPools = computed<Pool[] | null>(() => {
  if (sortedPools.value === null)
    return null

  return sortedPools.value.slice(0, page.value * pageSize)
})

watch(rawPoolIds, (value, oldValue) => {
  if (value !== null) {
    if (intervals.rewards === null)
      intervals.rewards = useIntervalFn(fetchRewards, refetchRewardsInterval, { immediateCallback: true })
    else if (!isEqual(value, oldValue))
      fetchRewards(value.filter(id => !oldValue?.includes(id)))
  }
}, { immediate: true })

onBeforeUnmount(() => {
  intervals.rewards?.pause()
})

const rewardsFetched = computed(() => {
  return rawPools.value?.every(pool => rewards.value[pool.id] !== undefined) ?? false
})

const loading = computed(() => {
  return pools.value === null || !rewardsFetched.value
})

// function updateStaked(poolId: Pool['id'], diff: BigNumber) {
//   if (!PoolsQuery.result.value)
//     return

//   const diffInWei = $kaikas.bigNumber($kaikas.utils.toWei(diff.toString()))
//   const farmingQueryResult = JSON.parse(JSON.stringify(FarmingQuery.result.value)) as FarmingQueryResult
//   const pool = farmingQueryResult.farming.pools.find(pool => pool.id === poolId)
//   if (!pool)
//     return
  
//   pool.totalTokensStaked = $kaikas.bigNumber(pool.totalTokensStaked).plus(diffInWei).toFixed(0)

//   const user = pool.users[0] ?? null
//   if (!user)
//     return

//   user.amount = $kaikas.bigNumber(user.amount).plus(diffInWei).toFixed(0)
//   FarmingQuery.result.value = farmingQueryResult
// }

// function updateBalance(pairId: Pool['pairId'], diff: BigNumber) {
//   if (!LiquidityPositionsQuery.result.value)
//     return

//   const liquidityPositionsQueryResult = JSON.parse(JSON.stringify(LiquidityPositionsQuery.result.value)) as LiquidityPositionsQueryResult
//   const liquidityPosition = liquidityPositionsQueryResult.user.liquidityPositions.find(liquidityPosition => liquidityPosition.pair.id === pairId) ?? null
//   if (!liquidityPosition)
//     return

//   liquidityPosition.liquidityTokenBalance = `${$kaikas.bigNumber(liquidityPosition.liquidityTokenBalance).plus(diff)}`
//   LiquidityPositionsQuery.result.value = liquidityPositionsQueryResult
// }

// function handleStaked(pool: Pool, amount: string) {
//   updateStaked(pool.id, $kaikas.bigNumber(amount))
//   updateBalance(pool.pairId, $kaikas.bigNumber(0).minus(amount))
// }
// function handleUnstaked(pool: Pool, amount: string) {
//   updateStaked(pool.id, $kaikas.bigNumber(0).minus(amount))
//   updateBalance(pool.pairId, $kaikas.bigNumber(amount))
// }
</script>

<template>
  <div v-bem>
    <template v-if="rawPools">
      <div v-bem="'list'">
        <!-- <FarmingModulePool
          v-for="pool in paginatedPools"
          :key="pool.id"
          :pool="pool"
          @staked="(value: string) => handleStaked(pool, value)"
          @unstaked="(value: string) => handleUnstaked(pool, value)"
        /> -->
        <StakingModulePool
          v-for="pool in paginatedPools"
          :key="pool.id"
          :pool="pool"
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

.staking-module
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
