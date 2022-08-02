<script setup lang="ts">
import BigNumber from 'bignumber.js'
import { LiquidityPairsPosition } from '../query.liquidity-pairs'

const props = defineProps<{
  positions: LiquidityPairsPosition[]
}>()

const filtered = computed(() => props.positions.filter((x) => new BigNumber(x.liquidityTokenBalance).isGreaterThan(0)))
</script>

<template>
  <div
    v-if="positions"
    class="px-4 space-y-4"
  >
    <ModuleLiquidityViewPairsListItem
      v-for="item in filtered"
      :key="item.pair.name"
      :data="item"
      :always-opened="positions.length === 1"
      data-testid="pair-list-item"
    />
  </div>
</template>
