<script setup lang="ts" name="FarmingModule">
import { useQuery } from '@vue/apollo-composable'
import type { Pausable } from '@vueuse/core'
import { SButton } from '@soramitsu-ui/ui'
import BigNumber from 'bignumber.js'
import isEqual from 'lodash/fp/isEqual'

import {
  FarmingQueryResult,
  Pool,
  PoolWithoutReward,
  PairsQueryResult,
  LiquidityPositionsQueryResult,
  Rewards,
  Sorting
} from './types'
import {
  farmingQuery,
  pairsQuery,
  multicallContractAddress,
  farmingContractAddress,
  liquidityPositionsQuery,
  refetchFarmingInterval,
  refetchRewardsInterval,
  pageSize
} from './const'
import {
  useInstanceInterval
} from '@/utils/common'
import { AbiItem } from 'caver-js'
import farmingAbi from '@/utils/smartcontracts/farming.json'
import multicallAbi from '@/utils/smartcontracts/multicall.json'
import { useConfigWithConnectedKaikas } from '@/utils/kaikas/config'
import { Multicall } from '@/types/typechain/farming/MultiCall.sol'

const { caver } = window
const config = useConfigWithConnectedKaikas()

const vBem = useBemClass()
const farmingStore = useFarmingStore()
const { stakedOnly, searchQuery, sorting } = toRefs(farmingStore)

const page = ref(1)
const pairsQueryEnabled = ref(false)
const rewards = ref<Rewards>({})
const currentBlock = ref<number | null>(null)
const intervals: Record<'rewards' | 'currentBlock', Pausable | null> = {
  rewards: null,
  currentBlock: null,
}
const pairsQueryVariables = ref({
  pairIds: [] as string[]
})

const MulticallContract = config.createContract<Multicall>(multicallContractAddress, multicallAbi.abi as AbiItem[])

const FarmingQuery = useQuery<FarmingQueryResult>(
  farmingQuery,
  { 
    userId: config.address
  },
  {
    clientId: 'farming',
    pollInterval: refetchFarmingInterval
  }
)

const farming = computed(() => {
  return FarmingQuery.result.value?.farming ?? null
})

const poolPairIds = computed(() => {
  return farming.value?.pools.map(pool => pool.pair) ?? []
})

function handleFarmingQueryResult() {
  if (!pairsQueryEnabled.value) pairsQueryEnabled.value = true
  pairsQueryVariables.value.pairIds = poolPairIds.value
}

// Workaround for cached results: https://github.com/vuejs/apollo/issues/1154
if (FarmingQuery.result.value)
  handleFarmingQueryResult()

FarmingQuery.onResult(() => {
  handleFarmingQueryResult()
})

async function fetchCurrentBlock() {
  currentBlock.value = await caver.klay.getBlockNumber()

  useInstanceInterval(() => {
    if (currentBlock.value === null)
      return

    currentBlock.value += 1
  }, 1000)
}

fetchCurrentBlock()

async function fetchRewards(poolIds?: Pool['id'][]) {
  let ids = poolIds

  if (!ids)
    if (paginatedPoolsWithoutRewards.value === null)
      throw new Error('There are no pools for an unknown reason')
    else
      ids = paginatedPoolsWithoutRewards.value.map(pool => pool.id)

  const abiItem = farmingAbi.abi.find(item => item.name === 'pendingPtn') as AbiItem

  const calls = ids.map(poolId => {
    return [
      farmingContractAddress,
      caver.klay.abi.encodeFunctionCall(abiItem, [
        poolId,
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

  currentBlock.value = Number(result.blockNumber)

  rewards.value = {
    ...rewards.value,
    ...newRewards
  }
}

const PairsQuery = useQuery<PairsQueryResult>(
  pairsQuery,
  pairsQueryVariables,
  () => ({
    clientId: 'exchange',
    enabled: pairsQueryEnabled.value,
  })
)

const pairs = computed(() => {
  return PairsQuery.result.value?.pairs ?? null
})

const showViewMore = computed(() => {
  if (!farming.value)
    return false

  return farming.value?.poolCount > (page.value * pageSize) && pools.value !== null && pools.value.length !== 0
})

async function viewMore() {
  page.value++
}

const LiquidityPositionsQuery = useQuery<LiquidityPositionsQueryResult>(
  liquidityPositionsQuery,
  { userId: config.address },
  { clientId: 'exchange' }
)

const liquidityPositions = computed(() => {
  if (!LiquidityPositionsQuery.result.value)
    return null
  return LiquidityPositionsQuery.result.value.user?.liquidityPositions ?? []
})

const poolsWithoutRewards = computed<PoolWithoutReward[] | null>(() => {
  if (farming.value === null || pairs.value === null || currentBlock.value === null)
    return null

  const pools = [] as PoolWithoutReward[]

  farming.value.pools.forEach(pool => {
    if (farming.value === null || pairs.value === null || currentBlock.value === null)
      return

    const id = pool.id
    const pair = pairs.value.find(pair => pair.id === pool.pair) ?? null

    if (pair === null)
      return 

    const pairId = pair.id
    const name = pair.name

    const staked = $kaikas.bigNumber($kaikas.fromWei(pool.users[0]?.amount ?? '0'))
  
    const liquidityPosition = liquidityPositions.value?.find(position => position.pair.id === pairId) ?? null
    const balance = $kaikas.bigNumber(liquidityPosition?.liquidityTokenBalance ?? 0)

    const annualPercentageRate = $kaikas.bigNumber(0)

    const reserveUSD = $kaikas.bigNumber(pair.reserveUSD)
    const totalSupply = $kaikas.bigNumber(pair.totalSupply)
    const totalTokensStaked = $kaikas.bigNumber($kaikas.utils.fromWei(pool.totalTokensStaked))
    const liquidity = reserveUSD.dividedBy(totalSupply).multipliedBy(totalTokensStaked)

    const bonusEndBlock = Number(pool.bonusEndBlock)
    const allocPoint = $kaikas.bigNumber(pool.allocPoint)
    const totalAllocPoint = $kaikas.bigNumber(farming.value.totalAllocPoint)
    const bonusMultiplier = $kaikas.bigNumber(pool.bonusMultiplier)
    const multiplier = allocPoint.dividedBy(totalAllocPoint).multipliedBy(currentBlock.value < bonusEndBlock ? bonusMultiplier : 1)

    const createdAtBlock = Number(pool.createdAtBlock)

    pools.push({
      id,
      name,
      pairId,
      staked,
      balance,
      annualPercentageRate,
      liquidity,
      multiplier,
      createdAtBlock
    })
  })

  return pools
})

const filteredPoolsWithoutRewards = computed<PoolWithoutReward[] | null>(() => {
  if (poolsWithoutRewards.value === null)
    return null

  let filteredPools = [ ...poolsWithoutRewards.value ]

  if (stakedOnly.value)
    filteredPools = filteredPools?.filter(pool => pool.staked.comparedTo(0) === 0)

  if (searchQuery.value)
    filteredPools = filteredPools?.filter(pool => pool.name.toLowerCase().includes(searchQuery.value.toLowerCase()))

  return filteredPools
})

const sortedPoolsWithoutRewards = computed<PoolWithoutReward[] | null>(() => {
  if (filteredPoolsWithoutRewards.value === null)
    return null

  let sortedPools = [ ...filteredPoolsWithoutRewards.value ]

  if (sorting.value === Sorting.Liquidity)
    sortedPools = sortedPools?.sort((poolA, poolB) => poolA.liquidity.comparedTo(poolB.liquidity))

  if (sorting.value === Sorting.APR)
    sortedPools = sortedPools?.sort((poolA, poolB) => poolA.annualPercentageRate.comparedTo(poolB.annualPercentageRate))

  if (sorting.value === Sorting.Multiplier)
    sortedPools = sortedPools?.sort((poolA, poolB) => poolA.multiplier.comparedTo(poolB.multiplier))

  return filteredPools
})

const paginatedPoolsWithoutRewards = computed<PoolWithoutReward[] | null>(() => {
  if (sortedPoolsWithoutRewards.value === null)
    return null

  return sortedPoolsWithoutRewards.value.slice(0, page.value * pageSize)
})

const paginatedPoolIds = computed<Pool['id'][] | null>(() => {
  if (paginatedPoolsWithoutRewards.value === null)
    return null

  return paginatedPoolsWithoutRewards.value.map(pool => pool.id)
})

watch(paginatedPoolIds, (value, oldValue) => {
  if (value !== null) {
    if (intervals.rewards === null)
      intervals.rewards = useInstanceInterval(fetchRewards, refetchRewardsInterval, { immediateCallback: true })
    else if (!isEqual(value, oldValue))
      fetchRewards(value.filter(id => !oldValue?.includes(id)))
  }
})

const pools = computed<Pool[] | null>(() => {
  if (paginatedPoolsWithoutRewards.value === null)
    return null

  const pools = [] as Pool[]

  paginatedPoolsWithoutRewards.value.forEach(pool => {
    const reward = rewards.value[pool.id]
    const earned = reward ? $kaikas.bigNumber(reward) : null

    if (earned === null)
      return
    
    pools.push({
      ...pool,
      earned
    })
  })

  return pools
})

const rewardsFetched = computed(() => {
  return paginatedPoolsWithoutRewards.value?.every(pool => rewards.value[pool.id] !== undefined) ?? false
})

const loading = computed(() => {
  return pools.value === null || !rewardsFetched.value
})

function updateStaked(poolId: Pool['id'], diff: BigNumber) {
  if (!FarmingQuery.result.value)
    return

  const diffInWei = $kaikas.bigNumber($kaikas.utils.toWei(diff.toString()))
  const farmingQueryResult = JSON.parse(JSON.stringify(FarmingQuery.result.value)) as FarmingQueryResult
  const pool = farmingQueryResult.farming.pools.find(pool => pool.id === poolId)
  if (!pool)
    return
  
  pool.totalTokensStaked = $kaikas.bigNumber(pool.totalTokensStaked).plus(diffInWei).toFixed(0)

  const user = pool.users[0] ?? null
  if (!user)
    return

  user.amount = $kaikas.bigNumber(user.amount).plus(diffInWei).toFixed(0)
  FarmingQuery.result.value = farmingQueryResult
}

function updateBalance(pairId: Pool['pairId'], diff: BigNumber) {
  if (!LiquidityPositionsQuery.result.value)
    return

  const liquidityPositionsQueryResult = JSON.parse(JSON.stringify(LiquidityPositionsQuery.result.value)) as LiquidityPositionsQueryResult
  const liquidityPosition = liquidityPositionsQueryResult.user.liquidityPositions.find(liquidityPosition => liquidityPosition.pair.id === pairId) ?? null
  if (!liquidityPosition)
    return

  liquidityPosition.liquidityTokenBalance = `${$kaikas.bigNumber(liquidityPosition.liquidityTokenBalance).plus(diff)}`
  LiquidityPositionsQuery.result.value = liquidityPositionsQueryResult
}

function handleStaked(pool: Pool, amount: string) {
  updateStaked(pool.id, $kaikas.bigNumber(amount))
  updateBalance(pool.pairId, $kaikas.bigNumber(0).minus(amount))
}
function handleUnstaked(pool: Pool, amount: string) {
  updateStaked(pool.id, $kaikas.bigNumber(0).minus(amount))
  updateBalance(pool.pairId, $kaikas.bigNumber(amount))
}
</script>

<template>
  <div v-bem>
    <template v-if="farming">
      <div v-bem="'list'">
        <FarmingModulePool
          v-for="pool in pools"
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

.farming-module
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
