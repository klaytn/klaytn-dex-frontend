<script setup lang="ts">
const store = useLiquidityPairsStore()

const pairs = computed(() => store.queryAnyway.result?.user?.liquidityPositions ?? null)
</script>

<template>
  <template v-if="pairs">
    <div
      v-for="item in pairs"
      :key="item.pair.name"
    >
      {{ item }}
    </div>
  </template>
</template>
