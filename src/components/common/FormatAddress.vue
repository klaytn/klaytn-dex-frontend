<script setup lang="ts">
import { Address, formatAddress } from '@/core'

const props = defineProps<{
  value: Address
  length?: number
}>()

const formatted = computed(() => formatAddress(props.value, props.length))
</script>

<template>
  {{ formatted }}
</template>
