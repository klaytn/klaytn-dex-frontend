<script setup lang="ts" name="KlayIcon">
// TODO remove component?

const props = defineProps<{
  name: string
  char?: string
}>()
const { name, char } = toRefs(props)

const CurrentIcon = defineAsyncComponent(() => import(`../assets/icons/${props.name}.svg?component`))
</script>

<template>
  <div
    v-if="char"
    class="char"
  >
    {{ char }}
  </div>
  <CurrentIcon
    v-else
    class="svg-icon"
  />
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.char {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  background: #dfe4ed;
  border-radius: 50%;
  font-weight: 700;
  text-align: center;
  font-size: 12px;
  border: 2px solid $white;
  box-sizing: content-box;
}
</style>
