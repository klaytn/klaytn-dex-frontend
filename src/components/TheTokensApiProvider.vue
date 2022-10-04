<script setup lang="ts">
import { apiKey } from '@/utils/minimal-tokens-api'

provide(apiKey, createMinimalTokenApiWithStores())
</script>

<template>
  <slot />
</template>
