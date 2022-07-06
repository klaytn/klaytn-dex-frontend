<script setup lang="ts" name="FarmingModule">
import { useQuery } from '@vue/apollo-composable'
import { SButton } from '@soramitsu-ui/ui'

import {
  FarmingsQueryResult,
  Pool,
  PairsQueryResult,
  Pair,
  LiquidityPositionsQueryResult,
  UserInfo
} from './types'
import {
  farmingsQuery,
  pairsQuery,
  farmingContractAddress,
  liquidityPositionsQuery
} from './const'
import { AbiItem } from 'caver-js'
import { Farming } from '@/types/typechain/farming'
import farmingAbi from '@/utils/smartcontracts/farming.json'
import { useConfigWithConnectedKaikas } from '@/utils/kaikas/config'

const config = useConfigWithConnectedKaikas()

const vBem = useBemClass()

const pageSize = 3
const pageOffset = ref(0)

const FarmingContract = config.createContract<Farming>(farmingContractAddress, farmingAbi.abi as AbiItem[])

const FarmingsQuery = useQuery<FarmingsQueryResult>(
  farmingsQuery,
  {
    first: pageSize,
    skip: pageOffset.value,
  },
  { clientId: 'farming' }
)

const pairsQueryEnabled = ref(false)

const farming = computed(() => {
  return FarmingsQuery.result.value?.farmings[0] ?? null
})

const rewards = ref<Record<Pool['id'], string>>({})

function fetchRewards() {
  farming.value?.pools.forEach(async pool => {
    const reward = await FarmingContract.methods.pendingPtn(
      pool.id,
      config.address,
    ).call()

    rewards.value[pool.id] = $kaikas.utils.fromWei(reward)
  })
}

const userInfoIntervalId = setInterval(fetchRewards, 1000)

const userInfoList = ref<Record<Pool['id'], UserInfo>>({})

function fetchUserInfo() {
  farming.value?.pools.forEach(async pool => {
    const userInfo = await FarmingContract.methods.userInfo(
      pool.id,
      config.address,
    ).call()

    userInfoList.value[pool.id] = userInfo
  })
}

onBeforeUnmount(() => {
  clearInterval(userInfoIntervalId)
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

function fetchMorePairs(pairIds: Pair['id'][]) {
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

const allAdditionalDataFetched = computed(() => {
  return farming.value?.pools?.every(pool => rewards.value[pool.id] !== undefined && userInfoList.value[pool.id] !== undefined)
})

const loading = computed(() => {
  return FarmingsQuery.loading.value || PairsQuery.loading.value || !allAdditionalDataFetched.value
})

const LiquidityPositionsQuery = useQuery<LiquidityPositionsQueryResult>(
  liquidityPositionsQuery,
  { userId: config.address },
  { clientId: 'exchange' }
)

const liquidityPositions = computed(() => {
  return LiquidityPositionsQuery.result.value?.user.liquidityPositions
})

FarmingsQuery.onResult(async () => {
  if (!pairsQueryEnabled.value) {
    pairsQueryEnabled.value = true
    pairsQueryVariables.value.pairIds = poolPairIds.value
  }
  fetchRewards()
  fetchUserInfo()
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
    const userInfo = userInfoList.value[pool.id] ?? null

    if (pair === null || earned === null || userInfo === null)
      return

    const pairId = pair.id
    const name = pair.name
    const liquidityPosition = liquidityPositions.value?.find(position => position.pair.id === pairId) ?? null
    const balance = $kaikas.bigNumber(liquidityPosition?.liquidityTokenBalance ?? 0)
    const staked = $kaikas.bigNumber($kaikas.fromWei(userInfo.amount))
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
          :liquidity-positions="liquidityPositions"
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
