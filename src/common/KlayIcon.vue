<script setup lang="ts" name="KlayIcon">
const props = withDefaults(
  defineProps<{
    name?: string
    symbol?: string
    saturation?: number
    lightness?: number
  }>(),
  {
    name: 'empty-token',
    symbol: '',
    saturation: 80,
    lightness: 70
  },
)
const { name, symbol, saturation, lightness } = toRefs(props)

const char = computed(() => {
  return symbol?.value?.[0] ?? ''
})

const hslGenerator = (str: string, s: number, l: number) => {
  const [...strArray] = str
  const hash = strArray.reduce((a, c) => {
    const h = c.charCodeAt(0) + ((a << 4) - a)
    return h % 360
  }, 0)
  return `hsl(${hash}, ${s}%, ${l}%)`
}

const CurrentIcon = defineAsyncComponent(() => import(`../assets/icons/${name.value}.svg`))
</script>

<template>
  <div
    v-if="symbol"
    class="char"
    :style="{ background: hslGenerator(symbol, saturation, lightness) }"
  >
    {{ char }}
  </div>
  <CurrentIcon
    v-else
    class="svg-icon"
  />
</template>

<style lang="scss" scoped>
@import '@/styles/vars.sass';

.char {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-weight: 700;
  text-align: center;
  font-size: 12px;
  box-sizing: content-box;
}
</style>
