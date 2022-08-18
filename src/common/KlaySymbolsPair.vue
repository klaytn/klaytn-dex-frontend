<script setup lang="ts">
import { TokenSymbol } from '@/core'

defineProps<{
  tokenA: TokenSymbol
  tokenB: TokenSymbol
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
