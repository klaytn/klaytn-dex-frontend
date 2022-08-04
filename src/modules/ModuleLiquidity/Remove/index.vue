<script lang="ts" setup>
import { RouteName } from '@/types'
import { storeToRefs } from 'pinia'
import { Tab } from './const'

const active = useLocalStorage<Tab>('liquidity-remove-active-tab', 'amount')

const store = useLiquidityRmStore()
const { prepareSupplyState, isReadyToPrepareSupply } = storeToRefs(store)

const router = useRouter()

if (!store.selected) {
  // there is no point to stay here if there is no selection
  router.push({ name: RouteName.Liquidity })
}

onUnmounted(() => store.clear())
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
      @click="store.prepareSupply()"
    >
      Remove
    </KlayButton>

    <ModuleLiquidityRemoveLpTokensDetails />
  </div>

  <ModuleLiquidityRemoveConfirmModal />
</template>
