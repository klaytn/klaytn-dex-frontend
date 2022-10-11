<script setup lang="ts">
import { KlayIconKaikas } from '~klay-icons'
import IconLogosMetamask from '~icons/logos/metamask-icon'
import { SupportedWallet } from '@/core'

defineProps<{
  wallet: 'metamask' | 'kaikas'
}>()

function walletIcon(wallet: SupportedWallet) {
  return wallet === 'metamask' ? IconLogosMetamask : KlayIconKaikas
}
</script>

<template>
  <component :is="walletIcon(wallet)" />
</template>
