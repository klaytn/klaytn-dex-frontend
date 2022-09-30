<script setup lang="ts">
import { useTradeStore } from '../ModuleTradeShared/trade-store'
import { useLiquidityPairsQuery } from './query.liquidity-pairs'

const { loading: isLoading, result, refetch } = useLiquidityPairsQuery()

// Refetch if cached
if (result.value && !isLoading.value) refetch()

const isLoaded = computed(() => !!result.value)
const isUserEmpty = computed(() => result.value && !result.value.user)

const tradeStore = useTradeStore()

tradeStore.useRefresh({
  run: () => refetch(),
  pending: isLoading,
})
</script>

<template>
  <div class="space-y-4">
    <h3 class="title px-4">
      Your liquidity
    </h3>

    <div
      v-if="isUserEmpty"
      class="px-4"
    >
      Empty
    </div>

    <ModuleLiquidityViewPairsList
      v-if="isLoaded && !isUserEmpty"
      :positions="result!.user?.liquidityPositions"
    />
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.title {
  text-align: left;
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: $dark2;
}
</style>
