<script setup lang="ts">
defineProps<{
  value: any
}>()
</script>

<template>
  <template v-if="value">
    {{ value }}
  </template>
  <template v-else>
    &mdash;
  </template>
</template>
