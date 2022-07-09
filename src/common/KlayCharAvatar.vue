<script setup lang="ts" name="KlayIcon">
const props = defineProps<{
  content: string
}>()

const firstCapital = computed(() => props.content?.slice(0, 1).toUpperCase())
</script>

<template>
  <div>
    {{ firstCapital }}
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

div {
  width: 24px;
  height: 24px;
  background: $gray5;
  border-radius: 50%;
  font-weight: 700;
  text-align: center;
  padding-top: 6px;
  font-size: 12px;
  border: 1px solid $gray4;
}
</style>
