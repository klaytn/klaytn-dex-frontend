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
      class="w-[420px]"
    >
      <div
        v-if="supplyState?.fulfilled"
        class="p-8 flex flex-col items-center space-y-4"
      >
        <p class="text-xl">
          Ok!
        </p>

        <KlayButton @click="show = false">
          Close
        </KlayButton>
      </div>
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
