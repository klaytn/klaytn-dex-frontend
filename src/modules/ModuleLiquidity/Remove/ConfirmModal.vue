<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'
import { storeToRefs } from 'pinia'

const store = useLiquidityRmStore()
const { supplyState, prepareSupplyState } = storeToRefs(store)

const show = computed({
  get: () => prepareSupplyState.value?.fulfilled,
  set: (flag) => {
    if (!flag) {
      store.closeSupply()
    }
  },
})

function supply() {
  store.supply()
}
</script>

<template>
  <SModal v-model:show="show">
    <KlayModalCard
      title="Remove LP Tokens"
      class="w-420px lt-sm:mx-2"
    >
      <KlayModalTemplateSubmitted v-if="supplyState?.fulfilled" />
      <KlayModalTemplateError v-else-if="supplyState?.rejected" />
      <div
        v-else
        class="space-y-4"
      >
        <ModuleLiquidityRemoveConfirmModalYouWillReceive />
        <ModuleLiquidityRemoveConfirmModalDetails />

        <KlayButton
          :loading="supplyState?.pending"
          class="w-full"
          type="primary"
          size="lg"
          @click="supply()"
        >
          Confirm Remove
        </KlayButton>
      </div>
    </KlayModalCard>
  </SModal>
</template>
