<script setup lang="ts">
import { CurrencySymbol } from '@/core'

defineProps<{
  tokenA: CurrencySymbol
  tokenB: CurrencySymbol
}>()
</script>

<template>
  <div class="flex">
    <KlayCharAvatar :symbol="tokenA" />
    <KlayCharAvatar
      :symbol="tokenB"
      class="-ml-2"
    />
  </div>
</template>
