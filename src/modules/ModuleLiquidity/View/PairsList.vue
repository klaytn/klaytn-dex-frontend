<script setup lang="ts">
const store = useLiquidityPairsStore()

const pairs = computed(() => store.queryAnyway.result?.user?.liquidityPositions ?? null)
</script>

<template>
  <div
    v-if="pairs"
    class="px-4 space-y-4"
  >
    <ModuleLiquidityViewPairsListItem
      v-for="item in pairs"
      :key="item.pair.name"
      :data="item"
    />
  </div>
</template>
