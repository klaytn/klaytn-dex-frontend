<script setup lang="ts">
import { storeToRefs } from 'pinia'

const dexStore = useDexStore()
const { initialDelayActive } = storeToRefs(dexStore)
</script>

<template>
  <slot v-if="!initialDelayActive" />
</template>
