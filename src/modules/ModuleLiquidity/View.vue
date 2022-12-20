<script setup lang="ts">
import { Address } from '@/core'
import { RouteName } from '@/types'
import { TokensPair } from '@/utils/pair'
import { useTradeStore } from '../ModuleTradeShared/trade-store'
import {
  LiquidityPairsPosition,
  POLL_INTERVAL,
  POLL_INTERVAL_QUICK,
  useLiquidityPairsQuery,
} from './query.liquidity-pairs'

const router = useRouter()

const liquidityListStore = useLiquidityListStore()

const pollInterval = computed(() => {
  return (liquidityListStore.quickPoll && POLL_INTERVAL_QUICK) || POLL_INTERVAL
})

const { loading: isLoading, result, refetch } = useLiquidityPairsQuery(pollInterval)

// Refetch if cached
if (result.value && !isLoading.value) refetch()

// const isLoaded = computed(() => !!result.value)

const tradeStore = useTradeStore()

tradeStore.useRefresh({
  run: () => refetch(),
  pending: isLoading,
})

const addLiquidityStore = useLiquidityAddStore()

function positionToAddresses({
  pair: {
    token0: { id: tokenA },
    token1: { id: tokenB },
  },
}: LiquidityPairsPosition): TokensPair<Address> {
  return { tokenA, tokenB }
}

function goToAddLiquidity(position: LiquidityPairsPosition) {
  addLiquidityStore.setBothAddresses(positionToAddresses(position))
  router.push({ name: RouteName.LiquidityAdd })
}

const rmLiquidityStore = useLiquidityRmStore()

function goToRemoveLiquidity(position: LiquidityPairsPosition) {
  rmLiquidityStore.setTokens(positionToAddresses(position))
  router.push({ name: RouteName.LiquidityRemove })
}

const farmingStore = useFarmingStore()

function goToFarms({ pair: { name: pairName } }: LiquidityPairsPosition) {
  farmingStore.setFilterByPairName(pairName)
  router.push({ name: RouteName.Farms })
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="title px-4">
      Your liquidity
    </h3>

    <ModuleLiquidityViewPairsList
      :positions="result?.user?.liquidityPositions || []"
      @click:add="goToAddLiquidity($event)"
      @click:remove="goToRemoveLiquidity($event)"
      @click:deposit="goToFarms($event)"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.title {
  text-align: left;
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: vars.$dark2;
}
</style>
