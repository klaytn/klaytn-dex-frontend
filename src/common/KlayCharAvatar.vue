<script setup lang="ts">
import { stringHashForHsl } from '@/utils/common'

const props = withDefaults(
  defineProps<{
    symbol?: string
    saturation?: number
    lightness?: number
  }>(),
  {
    symbol: '',
    saturation: 80,
    lightness: 70,
  },
)

const char = computed(() => {
  return props.symbol[0] ?? ''
})

const hsl = computed(() => `hsl(${stringHashForHsl(props.symbol)}, ${props.saturation}%, ${props.lightness}%)`)
</script>

<template>
  <div
    class="w-6 h-6 rounded-full flex items-center justify-center"
    :style="{ background: hsl }"
  >
    {{ char }}
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

div {
  font-weight: 700;
  font-size: 12px;
}
</style>
