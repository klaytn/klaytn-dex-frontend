<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'
import { storeToRefs } from 'pinia'

const store = useLiquidityRmStore()
const { isSupplyPending, isSupplyOk } = storeToRefs(store)
</script>

<template>
  <SModal
    :show="store.isSupplyReady"
    @update:show="store.closeSupply()"
  >
    <KlayModalCard
      title="Remove LP Tokens"
      class="w-[420px]"
    >
      <div
        v-if="isSupplyOk"
        class="p-8 flex flex-col items-center space-y-4"
      >
        <p class="text-xl">
          Ok!
        </p>

        <KlayButton @click="store.closeSupply()">
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
          :loading="isSupplyPending"
          class="w-full"
          type="primary"
          size="lg"
          @click="store.supply()"
        >
          Confirm Remove
        </KlayButton>
      </div>
    </KlayModalCard>
  </SModal>
</template>
