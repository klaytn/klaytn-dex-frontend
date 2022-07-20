<script setup lang="ts">
import { useLiquidityPairsQuery } from './query.liquidity-pairs'

const { loading: isLoading, result } = useLiquidityPairsQuery()

const isLoaded = computed(() => !!result.value)
const isUserEmpty = computed(() => result.value && !result.value.user)
</script>

<template>
  <div class="space-y-4">
    <h3 class="title px-4">
      Your liquidity
    </h3>

    <div
      v-if="isLoading"
      class="flex items-center justify-center p-8"
    >
      <KlayLoader />
    </div>

    <div
      v-else-if="isUserEmpty"
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
