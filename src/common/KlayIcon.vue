<script setup lang="ts" name="KlayIcon">
const props = defineProps<{
  name: string
  symbol?: string
}>()
const { name, symbol } = toRefs(props)

const char = computed(() => {
  return symbol?.value?.[0] ?? ''
})

function stringToHslColor(str: string, s: number, l: number) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  let h = hash % 400 // 460
  return 'hsl('+h+', '+s+'%, '+l+'%)'
}

const CurrentIcon = defineAsyncComponent(() => import(`../assets/icons/${name.value}.svg`))
</script>

<template>
  <div
    v-if="symbol"
    class="char"
    :style="{ background: stringToHslColor(symbol, 80, 70) }"
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
