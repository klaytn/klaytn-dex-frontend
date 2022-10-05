<script lang="ts" setup>
import { useTradeStore } from '@/modules/ModuleTradeShared/trade-store'

const addStore = useLiquidityAddStore()
const dexStore = useDexStore()

onUnmounted(() => addStore.resetInput())

const isSupplyDisabled = computed(() => {
  return !addStore.finalRates || !dexStore.isWalletConnected
})

const supplyLabel = computed(() => {
  return dexStore.isWalletConnected ? 'Supply' : 'Connect Wallet'
})

useTradeStore().useRefresh({
  run: () => addStore.refresh(),
  pending: toRef(addStore, 'isRefreshing'),
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
