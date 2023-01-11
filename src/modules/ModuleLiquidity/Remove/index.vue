<script lang="ts" setup>
import { useTradeStore } from '@/modules/ModuleTradeShared/trade-store'
import { storeToRefs } from 'pinia'
import { Tab } from './const'

const active = useLocalStorage<Tab>('liquidity-remove-active-tab', 'amount')

const rmStore = useLiquidityRmStore()
const { prepareSupplyState, isReadyToPrepareSupply, isRefreshing } = storeToRefs(rmStore)

useTradeStore().useRefresh({
  run: () => rmStore.refresh(),
  pending: isRefreshing,
})

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

    <SlippageToleranceInput v-model="rmStore.slippageNumeric" />

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
