<script setup lang="ts">
import { storeToRefs } from 'pinia'

const store = useLiquidityRmStore()
const { liquidityRelative: model } = storeToRefs(store)

function formatPercent(value: number): string {
  return `${~~(value * 100)}%`
}
</script>

<template>
  <div
    v-if="model !== null"
    class="space-y-2"
  >
    <div class="text-xl">
      {{ formatPercent(model) }}
    </div>

    <KlaySlider
      v-model="model"
      :min="0"
      :max="1"
    />

    <div class="grid grid-cols-5 gap-4">
      <KlayButton
        v-for="i in [0.1, 0.25, 0.5, 0.75]"
        :key="i"
        size="sm"
        @click="model = i"
      >
        {{ formatPercent(i) }}
      </KlayButton>

      <KlayButton
        type="primary"
        size="sm"
        @click="model = 1"
      >
        MAX
      </KlayButton>
    </div>
  </div>
</template>
