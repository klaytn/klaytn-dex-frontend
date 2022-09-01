<script setup lang="ts">
import { not } from '@vueuse/core'
import { storeToRefs } from 'pinia'

const store = useLiquidityRmStore()
const { liquidityRelative: relativeTo1, isPairLoaded } = storeToRefs(store)

const isNotActive = not(isPairLoaded)

const relativeTo100 = computed({
  get: () => (relativeTo1.value ?? 0) * 100,
  set: (num) => {
    relativeTo1.value = num * 0.01
  },
})

const pickerValueDebounced = ref(relativeTo100.value)
watch(relativeTo100, (val) => {
  pickerValueDebounced.value = val
})
watchDebounced(
  pickerValueDebounced,
  (value) => {
    if (!Number.isNaN(value)) relativeTo100.value = value
  },
  { debounce: 500 },
)

function formatPercent(value: number): string {
  return `${~~(value * 100)}%`
}
</script>

<template>
  <div class="space-y-2">
    <div class="text-xl">
      <span
        v-if="isNotActive"
        class="disabled-value"
      > &mdash; </span>
      <template v-else>
        {{ ~~pickerValueDebounced }}%
      </template>
    </div>

    <KlaySlider
      v-model="pickerValueDebounced"
      :disabled="isNotActive"
    />

    <div class="grid grid-cols-5 gap-4">
      <KlayButton
        v-for="i in [0.1, 0.25, 0.5, 0.75]"
        :key="i"
        size="sm"
        :disabled="isNotActive"
        @click="relativeTo1 = i"
      >
        {{ formatPercent(i) }}
      </KlayButton>

      <KlayButton
        type="primary"
        size="sm"
        :disabled="isNotActive"
        @click="relativeTo1 = 1"
      >
        MAX
      </KlayButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.disabled-value {
  color: $gray2;
}
</style>
