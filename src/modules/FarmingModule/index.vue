<script setup lang="ts" name="FarmingModule">
import { useQuery } from '@vue/apollo-composable'
import { SButton } from '@soramitsu-ui/ui'
import BigNumber from 'bignumber.js'

import {
  FarmingsQueryResult,
  Pool,
  PairsQueryResult,
  LiquidityPositionsQueryResult,
} from './types'
import {
  farmingsQuery,
  pairsQuery,
  farmingContractAddress,
  liquidityPositionsQuery,
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
const rewards = ref<Record<Pool['id'], string>>({})
const currentBlock = ref<number | null>(null)


const FarmingContract = config.createContract<Farming>(farmingContractAddress, farmingAbi.abi as AbiItem[])

const FarmingsQuery = useQuery<FarmingsQueryResult>(
  farmingsQuery,
  {
    first: pageSize,
    skip: pageOffset.value,
    userId: config.address
  },
  { clientId: 'farming' }
)

const farming = computed(() => {
  return FarmingsQuery.result.value?.farming ?? null
})

async function fetchCurrentBlock() {
  currentBlock.value = await caver.klay.getBlockNumber()
}

fetchCurrentBlock()
const currentBlockIntervalId = setInterval(fetchCurrentBlock, 60 * 1000)

onBeforeUnmount(() => {
  clearInterval(currentBlockIntervalId)
})

function fetchRewards() {
  farming.value?.pools.forEach(async pool => {
    const reward = await FarmingContract.methods.pendingPtn(
      pool.id,
      config.address,
    ).call()

    rewards.value[pool.id] = $kaikas.utils.fromWei(reward)
  })
}

const rewardsIntervalId = setInterval(fetchRewards, 1000)

onBeforeUnmount(() => {
  clearInterval(rewardsIntervalId)
})

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

  return farming.value?.poolCount > (pageOffset.value + pageSize) && !loading.value
})

function viewMore() {
  if (farming.value === null)
    return

  pageOffset.value = farming.value.pools.length

  FarmingsQuery.fetchMore({
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
}

function fetchMorePairs(pairIds: Pool['pairId'][]) {
  PairsQuery.fetchMore({
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
}

const rewardsFetched = computed(() => {
  return farming.value?.pools?.every(pool => rewards.value[pool.id] !== undefined) ?? false
})

const loading = computed(() => {
  return FarmingsQuery.loading.value || PairsQuery.loading.value || !rewardsFetched.value
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
  }
  fetchRewards()
}

// Workaround for cached results: https://github.com/vuejs/apollo/issues/1154
if (FarmingsQuery.result.value)
  handleFarmingQueryResult()

FarmingsQuery.onResult(async () => {
  handleFarmingQueryResult()
})

const pools = computed<Pool[] | null>(() => {
  if (farming.value === null)
    return null

  const pools = [] as Pool[]

  farming.value.pools.forEach(pool => {
    const id = pool.id
    const pair = pairs.value?.find(pair => pair.id === pool.pair) ?? null
    const reward = rewards.value[pool.id]
    const earned = reward !== undefined ? $kaikas.bigNumber(rewards.value[pool.id]) : null

    if (pair === null || earned === null || farming.value === null || currentBlock.value === null)
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
  if (!FarmingsQuery.result.value)
    return

  const diffInWei = $kaikas.bigNumber($kaikas.utils.toWei(diff.toString()))
  const farmingsQueryResult = JSON.parse(JSON.stringify(FarmingsQuery.result.value)) as FarmingsQueryResult
  const user = farmingsQueryResult.farming.pools.find(pool => pool.id === poolId)?.users[0] ?? null
  if (!user)
    return

  user.amount = `${$kaikas.bigNumber(user.amount).plus(diffInWei)}`
  FarmingsQuery.result.value = farmingsQueryResult
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
          @click="viewMore"
        >
          View more
        </SButton>
      </div>
    </template>
    <div
      v-if="loading"
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
