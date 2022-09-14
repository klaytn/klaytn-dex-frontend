<script setup lang="ts">
import { WHITELIST_TOKENS, Wei } from '@/core'
import BigNumber from 'bignumber.js'

const empty = computed(() => {
  return !tokens.length
})

const tokens = WHITELIST_TOKENS
</script>

<template>
  <div class="overflow-y-scroll">
    <div
      v-if="empty"
      class="p-4 text-center no-results"
    >
      There are no added assets
    </div>

    <template v-else>
      <template
        v-for="(token, i) in tokens"
        :key="token.address"
      >
        <hr
          v-if="i > 0"
          class="klay-divider mx-4 my-0 !w-auto"
        >

        <ModuleAssetsAssetsListItem
          :token="token"
          :usd-per-token="new BigNumber(1.2)"
          :balance="new Wei(0)"
        />
      </template>
    </template>
  </div>
</template>
