<script setup lang="ts">
import { stringHashForHsl } from '@/utils/common'

const props = withDefaults(
  defineProps<{
    symbol?: string
    saturation?: number
    lightness?: number
    size?: string | number
  }>(),
  {
    symbol: '',
    saturation: 80,
    lightness: 70,
    size: 24,
  },
)

const char = computed(() => {
  return props.symbol[0] ?? ''
})

const sizeAsStyle = computed(() => {
  const value = `${props.size}px`
  return { width: value, height: value }
})

const hsl = computed(() => `hsl(${stringHashForHsl(props.symbol)}, ${props.saturation}%, ${props.lightness}%)`)
</script>

<template>
  <div
    class="rounded-full flex items-center justify-center"
    :style="{ background: hsl, ...sizeAsStyle }"
  >
    {{ char }}
  </div>
</template>

<style lang="scss" scoped>
div {
  font-weight: 700;
  font-size: 12px;
}
</style>
