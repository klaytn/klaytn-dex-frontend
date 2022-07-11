<script setup lang="ts">
import { toRefs } from '@vueuse/core'

const liquidityPairsStore = useLiquidityPairsStore()
liquidityPairsStore.setupQueryInTheComponent()

const { isLoading, isUserEmpty } = toRefs(toRef(liquidityPairsStore, 'queryAnyway'))
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

    <ModuleLiquidityViewPairsList v-if="!isUserEmpty" />
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
