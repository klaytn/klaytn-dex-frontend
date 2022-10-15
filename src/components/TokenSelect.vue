<script setup lang="ts">
import { storeToRefs } from 'pinia'
import TokenSelectPure from './TokenSelectPure.vue'
import { WHITELIST_TOKENS } from '@/core'

const tokensStore = useTokensStore()

const { importedAddresses, isImportedPending } = storeToRefs(tokensStore)
</script>

<template>
  <TokenSelectPure
    :tokens-imported-addresses="importedAddresses"
    :tokens-whitelist="WHITELIST_TOKENS"
    :are-imported-tokens-pending="isImportedPending"
    @import-token="tokensStore.importToken($event)"
  />
</template>
