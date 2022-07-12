<script setup lang="ts">
const props = defineProps<{
  content: string
}>()

const firstCapital = computed(() => props.content?.slice(0, 1).toUpperCase())
</script>

<template>
  <div class="w-6 h-6 rounded-full flex items-center justify-center">
    {{ firstCapital }}
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

div {
  font-weight: 700;
  font-size: 12px;
  background: $gray5;
  border: 1px solid $gray4;
}
</style>
