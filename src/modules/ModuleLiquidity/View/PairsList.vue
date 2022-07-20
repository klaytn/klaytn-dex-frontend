<script setup lang="ts">
import { LiquidityPairsPosition } from '../query.liquidity-pairs'

defineProps<{
  positions: LiquidityPairsPosition[]
}>()
</script>

<template>
  <div
    v-if="positions"
    class="px-4 space-y-4"
  >
    <ModuleLiquidityViewPairsListItem
      v-for="item in positions"
      :key="item.pair.name"
      :data="item"
    />
  </div>
</template>
