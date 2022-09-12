<script setup lang="ts">
import { WHITELIST_TOKENS } from '@/core';

const empty = computed(() => {
  return !tokens.length
})

const tokens = WHITELIST_TOKENS

const totalPrice = 0
</script>
  
<template>
  <div class="flex-1 min-h-0 overflow-y-scroll list">
    <div class="h-full">
      <div
        v-if="empty"
        class="p-4 text-center no-results"
      >
        There are no added assets
      </div>
      <template v-else>
        <div>
          <span>Total</span>
          <span>{{ totalPrice }}</span>
        </div>
        <hr class="klay-divider my-4">
        <ModuleAssetsListItem
          v-for="token in tokens"
          :key="token.address"
          :token="token"
        />
      </template>
    </div>
  </div>
</template>
  