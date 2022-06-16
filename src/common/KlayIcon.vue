<script setup lang="ts" name="KlayIcon">
const { name, char } = defineProps<{
  name: string
  char?: string
}>()

const CurrentIcon = defineAsyncComponent(() => import(`../assets/svg/${name}.svg?component`))
</script>

<template>
  <div v-if="char" class="char">
    {{ char }}
  </div>
  <!-- eslint-disable vue/no-v-html -->
  <CurrentIcon
    v-else
    class="svg-icon"
  />
  <!-- eslint-enable -->
</template>

<style lang="scss" scoped>
.char {
  width: 24px;
  height:24px;
  background: $gray5;
  border-radius: 50%;
  font-weight: 700;
  text-align: center;
  padding-top: 6px;
  font-size: 12px;
  border: 1px solid $gray4;
}
</style>
