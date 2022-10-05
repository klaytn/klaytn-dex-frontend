<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { Tab } from './const'

const active = useLocalStorage<Tab>('liquidity-remove-active-tab', 'amount')

const rmStore = useLiquidityRmStore()
const { prepareSupplyState, isReadyToPrepareSupply } = storeToRefs(rmStore)

const rmSelectionStore = useLiquidityRmSelectionStore()

rmSelectionStore.setRouteIsActive(true)
onUnmounted(() => {
  rmSelectionStore.setRouteIsActive(false)
  rmStore.clear()
})
</script>

<template>
  <div class="px-4 space-y-4">
    <ModuleLiquidityRemoveTabs v-model="active" />

    <ModuleLiquidityRemoveModeAmount v-if="active === 'amount'" />
    <ModuleLiquidityRemoveModeDetailed v-else />

    <KlayButton
      type="primary"
      size="lg"
      class="w-full"
      :loading="prepareSupplyState?.pending"
      :disabled="!isReadyToPrepareSupply"
      @click="rmStore.prepareSupply()"
    >
      Remove
    </KlayButton>

    <ModuleLiquidityRemoveLpTokensDetails />
  </div>

  <ModuleLiquidityRemoveConfirmModal />
</template>
