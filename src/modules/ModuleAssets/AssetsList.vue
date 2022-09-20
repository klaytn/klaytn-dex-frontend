<script setup lang="ts">
import { Address } from '@/core'
import { RouteName } from '@/types'
import { storeToRefs } from 'pinia'

const assetsStore = useAssetsStore()
const swapStore = useSwapStore()
const router = useRouter()

const { tokensFilteredByHidden: tokens } = storeToRefs(assetsStore)

const isEmpty = computed(() => !tokens.value.length)

function gotoSwap(a: Address) {
  swapStore.setBothTokens({ tokenA: a, tokenB: null })
  router.push({ name: RouteName.Swap })
}

function hideAsset(a: Address) {
  assetsStore.toggleHidden(a, true)
}

function openDetails(a: Address) {
  // todo
}
</script>

<template>
  <div class="overflow-y-scroll">
    <div
      v-if="isEmpty"
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
          @goto-swap="gotoSwap(token.address)"
          @open-details="openDetails(token.address)"
          @hide="hideAsset(token.address)"
        />
      </template>
    </template>
  </div>
</template>
