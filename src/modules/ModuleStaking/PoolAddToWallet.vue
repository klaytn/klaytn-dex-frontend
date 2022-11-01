<script setup lang="ts">
import WalletIcon from '@/components/WalletIcon.vue'

defineProps<{
  connected: 'kaikas' | 'metamask'
}>()
</script>

<template>
  <div class="add-to-wallet flex items-center space-x-1">
    <span> Add to {{ connected === 'kaikas' ? 'Kaikas' : 'MetaMask' }} </span>
    <WalletIcon :wallet="connected" />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.add-to-wallet {
  cursor: pointer;

  &:hover {
    color: vars.$blue;
  }
}
</style>
