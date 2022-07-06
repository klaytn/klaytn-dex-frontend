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

const config = useConfigWithConnectedKaikas()

const vBem = useBemClass()

const pageSize = 3
const pageOffset = ref(0)
const pairsQueryEnabled = ref(false)
const rewards = ref<Record<Pool['id'], string>>({})

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
  return FarmingsQuery.result.value?.farmings[0] ?? null
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

      const previousFarming = previousResult.farmings[0]
      const newFarming = fetchMoreResult.farmings[0]

      fetchMorePairs(newFarming.pools.map(pool => pool.pair))

      // Concat previous pools with new pools
      return { farmings: [
        {
          ...newFarming,
          pools: [
            ...previousFarming.pools,
            ...newFarming.pools,
          ],
        }
      ]}
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
  return LiquidityPositionsQuery.result.value?.user.liquidityPositions
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

    if (pair === null || earned === null)
      return

    const pairId = pair.id
    const name = pair.name
    const staked = $kaikas.bigNumber($kaikas.fromWei(pool.users[0]?.pool.totalTokensStaked ?? '0'))
    const liquidityPosition = liquidityPositions.value?.find(position => position.pair.id === pairId) ?? null
    const balance = $kaikas.bigNumber(liquidityPosition?.liquidityTokenBalance ?? 0)
    const annualPercentageRate = $kaikas.bigNumber(0)
    const liquidity = $kaikas.bigNumber(pair.reserveUSD)
    const volume24H = $kaikas.bigNumber(pair.dayData[0].volumeUSD)
    const volumeUSD = pair.dayData.map(data => $kaikas.bigNumber(data.volumeUSD))
    let volume7D = $kaikas.bigNumber(0)
    volumeUSD.forEach(dayVolume => {
      volume7D = volume7D.plus(dayVolume)
    })

    pools.push({
      id,
      name,
      pairId,
      staked,
      earned,
      balance,
      annualPercentageRate,
      liquidity,
      volume24H,
      volume7D
    })
  })

  return pools
})

function updateStaked(poolId: Pool['id'], diff: BigNumber) {
  if (!FarmingsQuery.result.value)
    return

  const farmingsQueryResult = JSON.parse(JSON.stringify(FarmingsQuery.result.value)) as FarmingsQueryResult
  const pool = farmingsQueryResult.farmings[0].pools[0].users[0].pool
  pool.totalTokensStaked = `${$kaikas.bigNumber(pool.totalTokensStaked).plus(diff)}`
  FarmingsQuery.result.value = farmingsQueryResult
}

function handleStaked(poolId: Pool['id'], amount: string) {
  updateStaked(poolId, $kaikas.bigNumber($kaikas.utils.toWei(amount)))
}
function handleUnstaked(poolId: Pool['id'], amount: string) {
  updateStaked(poolId, $kaikas.bigNumber(0).minus($kaikas.bigNumber($kaikas.utils.toWei(amount))))
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
          @staked="(value: string) => handleStaked(pool.id, value)"
          @unstaked="(value: string) => handleUnstaked(pool.id, value)"
        />
      </div>
      <div
        v-if="farming?.poolCount > (pageOffset + pageSize) && !loading"
        v-bem="'footer'"
      >
        <SButton
          v-bem="'view-more'"
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
  max-width: 1190px
  &__list
    margin: 0 -16px
  &__footer
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
