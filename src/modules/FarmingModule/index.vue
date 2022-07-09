<script setup lang="ts" name="FarmingModule">
import { useQuery } from '@vue/apollo-composable'
import { SButton } from '@soramitsu-ui/ui'
import BigNumber from 'bignumber.js'

import {
  FarmingQueryResult,
  Pool,
  PairsQueryResult,
  LiquidityPositionsQueryResult,
  Rewards
} from './types'
import {
  farmingQuery,
  pairsQuery,
  farmingContractAddress,
  liquidityPositionsQuery,
  refetchFarmingInterval,
  refetchCurrentBlockInterval
} from './const'
import { AbiItem } from 'caver-js'
import { Farming } from '@/types/typechain/farming'
import farmingAbi from '@/utils/smartcontracts/farming.json'
import { useConfigWithConnectedKaikas } from '@/utils/kaikas/config'

const { caver } = window
const config = useConfigWithConnectedKaikas()

const vBem = useBemClass()

const pageSize = 3
const pageOffset = ref(0)
const pairsQueryEnabled = ref(false)
const rewards = ref<Rewards>({})
const currentBlock = ref<number | null>(null)
const viewMoreLoading = ref(false)
const fetchMorePairsLoading = ref(false)

const FarmingContract = config.createContract<Farming>(farmingContractAddress, farmingAbi.abi as AbiItem[])

const FarmingQuery = useQuery<FarmingQueryResult>(
  farmingQuery,
  {
    first: pageSize,
    skip: 0,
    userId: config.address
  },
  {
    clientId: 'farming'
  }
)

function refetchFarming() {
  if (!FarmingQuery.result.value)
    return

  FarmingQuery.refetch({
    first: FarmingQuery.result.value.farming.pools.length,
    skip: 0,
    userId: config.address
  })
}

const farmingIntervalId = setInterval(refetchFarming, refetchFarmingInterval * 1000)

onBeforeUnmount(() => {
  clearInterval(farmingIntervalId)
})

const farming = computed(() => {
  return FarmingQuery.result.value?.farming ?? null
})

async function fetchCurrentBlock() {
  currentBlock.value = await caver.klay.getBlockNumber()
}

fetchCurrentBlock()
const currentBlockIntervalId = setInterval(fetchCurrentBlock, refetchCurrentBlockInterval * 1000)

onBeforeUnmount(() => {
  clearInterval(currentBlockIntervalId)
})

async function fetchRewards() {
  if (!farming.value)
    throw new Error('There is no farming for an unknown reason')

  const newRewards: Rewards = {}
  const promises = farming.value?.pools.map(async pool => {
    const reward = await FarmingContract.methods.pendingPtn(
      pool.id,
      config.address,
    ).call()

    newRewards[pool.id] = $kaikas.utils.fromWei(reward)
  })
  await Promise.all(promises)

  rewards.value = newRewards
}

const poolPairIds = computed(() => {
  return farming.value?.pools.map(pool => pool.pair) ?? []
})

const pairsQueryVariables = ref({
  pairIds: [] as string[]
})

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

  return farming.value?.poolCount > (pageOffset.value + pageSize) && pools.value !== null && pools.value.length !== 0
})

async function viewMore() {
  if (farming.value === null)
    return

  pageOffset.value = farming.value.pools.length

  viewMoreLoading.value = true

  await FarmingQuery.fetchMore({
    variables: {
      first: pageSize,
      skip: pageOffset.value,
      userId: config.address
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      // No new pools
      if (!fetchMoreResult) return previousResult

      const previousFarming = previousResult.farming
      const newFarming = fetchMoreResult.farming

      fetchMorePairs(newFarming.pools.map(pool => pool.pair))

      // Concat previous pools with new pools
      return { farming: {
        ...newFarming,
        pools: [
          ...previousFarming.pools,
          ...newFarming.pools,
        ],
      }}
    },
  })

  viewMoreLoading.value = false
}

async function fetchMorePairs(pairIds: Pool['pairId'][]) {
  fetchMorePairsLoading.value = true

  await PairsQuery.fetchMore({
    variables: {
      pairIds
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      // No new pools
      if (!fetchMoreResult) return previousResult

      // Concat previous pools with new pools
      return { pairs: [
        ...previousResult.pairs,
        ...fetchMoreResult.pairs,
      ]}
    },
  })

  fetchMorePairsLoading.value = false
}

const rewardsFetched = computed(() => {
  return farming.value?.pools?.every(pool => rewards.value[pool.id] !== undefined) ?? false
})

const loading = computed(() => {
  return pools.value === null || viewMoreLoading.value || fetchMorePairsLoading.value || !rewardsFetched.value
})

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

function handleFarmingQueryResult() {
  if (!pairsQueryEnabled.value) {
    pairsQueryEnabled.value = true
    pairsQueryVariables.value.pairIds = poolPairIds.value
    fetchRewards()
  } else
    fetchRewards(true)
}

// Workaround for cached results: https://github.com/vuejs/apollo/issues/1154
if (FarmingQuery.result.value)
  handleFarmingQueryResult()

FarmingQuery.onResult(() => {
  handleFarmingQueryResult()
})

const pools = computed<Pool[] | null>(() => {
  if (farming.value === null || pairs.value === null || currentBlock.value === null)
    return null

  const pools = [] as Pool[]

  farming.value.pools.forEach(pool => {
    if (farming.value === null || pairs.value === null || currentBlock.value === null)
      return

    const id = pool.id
    const pair = pairs.value.find(pair => pair.id === pool.pair) ?? null

    const reward = rewards.value[pool.id]
    const earned = reward ? $kaikas.bigNumber(reward) : null

    if (pair === null || earned === null)
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

    pools.push({
      id,
      name,
      pairId,
      staked,
      earned,
      balance,
      annualPercentageRate,
      liquidity,
      multiplier
    })
  })

  return pools
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
  <EarnWrap
    v-bem
  >
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
  </EarnWrap>
</template>

<style lang="sass">
.farming-module
  &__list
    margin: 0 -16px
  &__view-more
    display: flex
    justify-content: center
    width: 100%
    margin-top: 8px
    margin-bottom: -11px
  &__loader
    display: flex
    justify-content: center
    align-items: center
    height: 82px
</style>
