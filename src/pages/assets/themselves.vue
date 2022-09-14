<route lang="yaml">
name: AssetsThemselves
path: ''
</route>

<script setup lang="ts">
import BigNumber from 'bignumber.js'

const totalUSD = new BigNumber(29972.42)
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="title-total flex pb-6 pt-4 px-4">
      <span class="flex-1">Total</span>
      <span>
        <!-- TODO format -->
        ${{ totalUSD.toString() }}
      </span>
    </div>

    <hr class="klay-divider m-0">

    <ModuleAssetsAssetsList class="flex-1" />

    <hr class="klay-divider m-0">

    <div class="p-4">
      <KlayButton
        type="primary"
        size="lg"
        class="w-full"
      >
        Add token
      </KlayButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title-total {
  font-size: 18px;
  font-weight: 700;
}
</style>
