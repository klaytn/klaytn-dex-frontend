<script lang="ts" setup>
const store = useLiquidityAddStore()
</script>

<template>
  <ModuleLiquidityAddConfirmModal />

  <div class="space-y-4 px-4">
    <ModuleLiquidityAddExchangeRate />

    <KlayButton
      class="w-full"
      size="lg"
      type="primary"
      @click="store.activateSupply()"
    >
      Supply
    </KlayButton>

    <ModuleLiquidityAddDetails />
  </div>
</template>
