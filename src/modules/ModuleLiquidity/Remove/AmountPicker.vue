<script setup lang="ts">
const percent = ref(0)

function formatPercent(value: number): string {
  return `${~~(value * 100)}%`
}
</script>

<template>
  <div class="space-y-2">
    <div class="text-xl">
      {{ formatPercent(percent) }}
    </div>

    <KlaySlider
      v-model="percent"
      min="0"
      max="1"
    />

    <div class="grid grid-cols-5 gap-4">
      <KlayButton
        v-for="i in [0.1, 0.25, 0.5, 0.75]"
        :key="i"
        size="sm"
        @click="percent = i"
      >
        {{ formatPercent(i) }}
      </KlayButton>

      <KlayButton
        type="primary"
        size="sm"
        @click="percent = 1"
      >
        MAX
      </KlayButton>
    </div>
  </div>
</template>
