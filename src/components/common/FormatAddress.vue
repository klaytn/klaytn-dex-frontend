<script setup lang="ts">
import { Address, formatAddress } from '@/core'

const props = defineProps<{
  value: Address
  length?: number
  keepPrefix?: boolean
}>()

const formatted = computed(() => formatAddress(props.value, props.length, props.keepPrefix))
</script>

<template>
  {{ formatted }}
</template>
