<script lang="ts" setup>
import { Tab } from './const'

const active = $ref<Tab>('amount')
const openConfirm = $ref(false)
</script>

<template>
  <div>
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

    <!-- <ModuleLiquidityRemoveDetails /> -->
  </div>

  <ModuleLiquidityRemoveConfirmModal v-model:open="openConfirm" />
</template>
