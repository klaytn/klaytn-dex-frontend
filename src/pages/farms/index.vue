<route lang="yaml">
name: Farms
</route>

<script setup lang="ts" name="Farms">
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { STextField, SButton } from '@soramitsu-ui/ui'

import {
  RouteName,
} from '@/types'
import {
  FarmingsQueryResult,
  Pool,
  PairsQueryResult,
  Pair,
  FilledPool,
  LiquidityPosition,
  LiquidityPositionsQueryResult,
UserInfo
} from './types'
import { AbiItem } from 'caver-js'
import { Farming } from '@/types/typechain/farming'
import farmingAbi from '@/utils/smartcontracts/farming.json'

const vBem = useBemClass()
const router = useRouter()
const { t } = useI18n()

const pageSize = 3
const pageOffset = ref(0)

const farmingContractAddress = '0x32be07fb9dbf294c2e92715f562f7aba02b7443a'

const FarmingContract = $kaikas.config.createContract<Farming>(farmingContractAddress, farmingAbi.abi as AbiItem[])

const farmingsQuery = gql`query FarmingsQuery($first: Int! $skip: Int!) {
  farmings {
    id
    poolCount
    pools(first: $first skip: $skip) {
      id
      pair
    }
  }
}`

const pairsQuery = gql`query PairsQuery($pairIds: [String]!) {
  pairs(
    where: { id_in: $pairIds }
  ) {
    id
    name
    dayData(first: 7, orderBy: timestamp, orderDirection: desc) {
      volumeUSD
    }
    reserveUSD
  }
}`

const liquidityPositionsQuery = gql`query LiquidityPositionsQuery($userId: String!) {
  user(id: $userId) {
    liquidityPositions {
      liquidityTokenBalance
      pair {
        id
      }
    }
  }
}`

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

const rewards = ref<Record<Pool['id'], number>>({})

function fetchRewards() {
  const address = $kaikas.config.address
  if (address === null)
    return

  farming.value?.pools.forEach(async pool => {
    const reward = await FarmingContract.methods.pendingPtn(
      pool.id,
      address,
    ).call()

    rewards.value[pool.id] = reward * Math.pow(0.1, 18)
  })
}

const userInfoIntervalId = setInterval(fetchRewards, 1000)

const userInfoList = ref<Record<Pool['id'], UserInfo>>({})

function fetchUserInfo() {
  const address = $kaikas.config.address
  if (address === null)
    return

  farming.value?.pools.forEach(async pool => {
    const userInfo = await FarmingContract.methods.userInfo(
      pool.id,
      address,
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

FarmingsQuery.onResult(async (result) => {
  if (!pairsQueryEnabled.value) {
    pairsQueryEnabled.value = true
    pairsQueryVariables.value.pairIds = poolPairIds.value
  }
  fetchRewards()
  fetchUserInfo()
})

const pairs = computed(() => {
  return PairsQuery.result.value?.pairs ?? null
})

const pools = computed<FilledPool[] | null>(() => {
  return farming.value?.pools.map(pool => {
    const pair = pairs.value?.find(pair => pair.id === pool.pair)
    const earned = typeof rewards.value[pool.id] === 'number'
      ? Number(rewards.value[pool.id].toFixed(6))
      : null
    const userInfo = userInfoList.value[pool.id] ?? null
    const liquidityPosition = liquidityPositions.value?.find(position => position.pair.id === pair?.id) ?? null
    const isStaked = userInfo ? $kaikas.bigNumber(userInfo.amount).comparedTo(0) === 0 : false
    let stats = {
      earned,
      APR: '',
      liquidity: '',
      volume24H: '',
      volume7D: '',
    }
    if (pair) {
      const APR = `%${0}`
      const liquidity = `$${Number(pair.reserveUSD).toFixed(0)}`
      const volume24H = `$${Number(pair.dayData[0].volumeUSD).toFixed(0)}`
      const volume7D = `$${pair.dayData
        .map(data => Number(data.volumeUSD))
        .reduce((acc, number) => acc + number, 0)
        .toFixed(0)}`

      stats = {
        ...stats,
        APR,
        liquidity,
        volume24H,
        volume7D,
      }
    }
    return {
      ...pool,
      pair: pair ? {
        ...pair,
        iconChars: pair.name.split('-').map(tokenName => tokenName[0]),
      } : null,
      stats,
      userInfo,
      liquidityPosition,
      isStaked
    }
  }).filter(pool => pool.pair !== null && pool.stats.earned !== null && pool.userInfo !== null) ?? null
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

function goToLiquidityAddPage (pairId: Pair['id']) {
  router.push({ name: RouteName.LiquidityAdd, params: { id: pairId } })
}

// const expandedPool = ref<Pool['id'] | null>(null)

// function handleAccordionModelUpdate(value: boolean, poolId: Pool['id']) {
//   if (value)
//     expandedPool.value = poolId
//   else
//     expandedPool.value = null
// }

const allAdditionalDataFetched = computed(() => {
  return farming.value?.pools?.every(pool => rewards.value[pool.id] !== undefined && userInfoList.value[pool.id] !== undefined)
})

const loading = computed(() => {
  return FarmingsQuery.loading.value || PairsQuery.loading.value || !allAdditionalDataFetched.value
})

const expandedPools = ref<Record<Pool['id'], boolean>>({})

const modalOpen = ref(false)
const modalProps = ref({
  pool: null as FilledPool | null,
  liquidityPosition: null as LiquidityPosition | null
})

const LiquidityPositionsQuery = useQuery<LiquidityPositionsQueryResult>(
  liquidityPositionsQuery,
  { userId: $kaikas.config.address },
  { clientId: 'exchange' }
)

const liquidityPositions = computed(() => {
  return LiquidityPositionsQuery.result.value?.user.liquidityPositions
})

function isLPBalanceEmpty(pool: FilledPool) {
  return $kaikas.bigNumber(pool.userInfo.amount).comparedTo(0) === 0
}

function stake(pool: FilledPool) {
  const liquidityPosition = LiquidityPositionsQuery.result.value?.user.liquidityPositions.find(position => position.pair.id === pool.pair.id) ?? null

  modalProps.value = {
    pool,
    liquidityPosition
  }
  modalOpen.value = true
}

function getStakedAmount (pool: FilledPool) {
  return $kaikas.utils.fromWei(pool.userInfo.amount)
}
</script>

<template>
  <EarnWrap
    v-bem
  >
    <template v-if="farming">
      <div v-bem="'list'">
        <!-- <KlayAccordionItem
          v-for="pool in pools"
          :key="pool.id"
          :modelValue="expandedPool === pool.id"
          @update:modelValue="value => handleAccordionModelUpdate(value, pool.id)"
        > -->
        <TransitionGroup>
          <KlayAccordionItem
            v-for="pool in pools"
            :key="pool.id"
            v-model="expandedPools[pool.id]"
            v-bem="'pool'"
          >
            <template
              v-if="pool.pair !== undefined"
              #title
            >
              <div v-bem="'pool-head'">
                <div v-bem="'pool-icons'">
                  <KlayIcon
                    v-for="(char, index) in pool.pair.iconChars"
                    :key="index"
                    v-bem="'pool-icon'"
                    :char="char"
                    name="empty-token"
                  />
                </div>
                <div v-bem="'pool-name'">
                  {{ pool.pair.name }}
                </div>
                <div
                  v-for="(value, label) in pool.stats"
                  :key="label"
                  v-bem="'pool-stats-item'"
                >
                  <div v-bem="'pool-stats-item-label'">
                    {{ t(`farmsPage.stats.${label}`) }}
                  </div>
                  <div v-bem="'pool-stats-item-value'">
                    {{ value }}
                    <KlayIcon
                      v-if="label === 'APR'"
                      v-bem="'pool-stats-item-calculator'"
                      name="calculator"
                    />
                  </div>
                </div>
              </div>
            </template>
            <template v-if="pool.pair !== undefined">
              <div v-bem="'pool-first-row'">
                <SButton
                  v-if="pool.isStaked"
                  v-bem="'enable'"
                  type="primary"
                  :disabled="isLPBalanceEmpty(pool)"
                  @click="stake(pool)"
                >
                  Enable {{ pool.pair.name }} balance
                </SButton>
                <div
                  v-if="!pool.isStaked"
                  v-bem="'staked-input-wrapper'"
                >
                  <STextField
                    v-bem="'staked-input'"
                    :value="getStakedAmount(pool)"
                    :disabled="true"
                  />
                  <div v-bem="'staked-input-buttons'">
                    <SButton
                      v-bem="'unstake'"
                    >
                      -
                    </SButton>
                    <SButton
                      v-bem="'stake-additional'"
                      @click="stake(pool)"
                    >
                      +
                    </SButton>
                  </div>
                </div>
                <SButton
                  v-bem="'get-lp'"
                  @click="goToLiquidityAddPage(pool.pair.id)"
                >
                  Get {{ pool.pair.name }} LP
                </SButton>
              </div>
              <div v-bem="'links'">
                <a
                  v-bem="'link'"
                  :href="`https://baobab.klaytnfinder.io/account/${farmingContractAddress}`"
                >
                  View Contract
                  <KlayIcon
                    v-bem="'link-icon'"
                    name="link"
                  />
                </a>
              </div>
            </template>
          </KlayAccordionItem>
        </TransitionGroup>
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
    <Transition>
      <div
        v-if="loading"
        v-bem="'loader'"
      >
        <KlayLoader />
      </div>
    </Transition>
  </EarnWrap>
  <FarmingModuleModal
    v-if="modalOpen"
    v-bind="modalProps"
    @close="modalOpen = false"
  />
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.farms
  max-width: 1190px
  &__list
    margin: 0 -16px
  &__pool
    &-head
      display: flex
      align-items: center
    &-icons
      display: flex
    &-icon:last-child
      margin-left: -9px
    &-name
      width: 130px
      margin-left: 8px
      font-size: 16px
    &-stats-item
      display: flex
      flex-direction: column
      flex: 1
      &-label
        font-weight: 500
        font-size: 12px
        color: $gray2
      &-value
        display: flex
        align-items: center
        font-size: 16px
      &-calculator
        margin-left: 5px
        fill: $gray3
    &-first-row
      display: flex
      align-items: center
  &__staked-input
    &-wrapper
      position: relative
    .s-text-field__input-wrapper
      height: 72px
      input
        padding: 16px 50% 33px 16px
        font-size: 30px
        font-weight: 600
        line-height: 39px
    &-buttons
      position: absolute
      right: 16px
      top: 16px
  &__unstake, &__stake-additional
    margin-left: 8px
  &__enable
    width: 240px
  &__get-lp
    width: 200px
    margin-left: 24px
  &__links
    display: flex
    margin-top: 16px
  &__link
    display: flex
    align-items: center
    font-size: 12px
    &-icon
      margin-left: 5px
      color: $gray3
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

  // .v-enter-active, .v-leave-active
  //   height: 84px
  //   transition: height 400ms ease, opacity 600ms ease-in-out
  // .v-leave-active
  //   height: 84px
  //   transition: height 400ms ease, opacity 100ms ease-in-out
  // .v-enter-from, .v-leave-to
  //   opacity: 0
  //   height: 0
</style>
