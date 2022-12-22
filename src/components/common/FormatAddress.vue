<script setup lang="ts">
import { Address, formatAddress } from '@/core'

const props = withDefaults(
  defineProps<{
    value: Address
    length?: number
    keepPrefix?: boolean
  }>(),
  {
    length: 4,
    keepPrefix: true,
  },
)

const formatted = computed(() => formatAddress(props.value, props.length, props.keepPrefix))
</script>

<template>
  {{ formatted }}
</template>
