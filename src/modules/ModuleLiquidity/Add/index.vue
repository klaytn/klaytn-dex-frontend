<script lang="ts" setup>
const addStore = useLiquidityAddStore()
const dexStore = useDexStore()

onUnmounted(() => addStore.resetInput())

const isSupplyDisabled = computed(() => {
  return !addStore.finalRates || !dexStore.isWalletConnected
})

const supplyLabel = computed(() => {
  return dexStore.isWalletConnected ? 'Supply' : 'Connect Wallet'
})
</script>

<template>
  <ModuleLiquidityAddConfirmModal />

  <div class="space-y-4 px-4">
    <ModuleLiquidityAddExchangeRate />

    <KlayButton
      class="w-full"
      size="lg"
      type="primary"
      :disabled="isSupplyDisabled"
      :loading="addStore.supplyScope?.prepareState.pending"
      @click="addStore.prepareSupply()"
    >
      {{ supplyLabel }}
    </KlayButton>

    <ModuleLiquidityAddDetails />
  </div>
</template>
