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
      :disabled="!store.isValid"
      :loading="store.supplyScope?.prepareState.pending"
      @click="store.prepareSupply()"
    >
      Supply
    </KlayButton>

    <ModuleLiquidityAddDetails />
  </div>
</template>
