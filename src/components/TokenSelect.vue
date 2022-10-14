<script setup lang="ts">
import { storeToRefs } from 'pinia'
import TokenSelectPure from './TokenSelectPure.vue'

const tokensStore = useTokensStore()

const { importedAddresses, isImportedPending, whitelistTokens } = storeToRefs(tokensStore)
</script>

<template>
  <TokenSelectPure
    :tokens-imported-addresses="importedAddresses"
    :tokens-whitelist="whitelistTokens"
    :are-imported-tokens-pending="isImportedPending"
    @import-token="tokensStore.importToken($event)"
  />
</template>
