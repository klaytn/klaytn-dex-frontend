<script lang="ts" setup>
import { RouteName } from '@/types'
import { Tab } from './const'

const active = ref<Tab>('amount')
const openConfirm = ref(false)

const store = useLiquidityRmStore()
const router = useRouter()

if (!store.selected) {
  // there is no point to stay here if there is no selection
  router.push({ name: RouteName.Liquidity })
}
</script>

<template>
  <div class="px-4 space-y-4">
    <ModuleLiquidityRemoveTabs v-model="active" />

    <ModuleLiquidityRemoveAmount v-if="active === 'amount'" />
    <ModuleLiquidityRemoveDetailed v-else />

    <KlayButton
      type="button"
      class="mt"
      @click="openConfirm = true"
    >
      Remove
    </KlayButton>

    <ModuleLiquidityRemoveDetails />
  </div>

  <ModuleLiquidityRemoveConfirmModal v-model:open="openConfirm" />
</template>
