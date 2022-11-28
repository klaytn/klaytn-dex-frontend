<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'
import { storeToRefs } from 'pinia'

const store = useSwapStore()
const { swapState } = storeToRefs(store)

const show = computed({
  get: () => store.prepareState?.fulfilled,
  set: (v) => {
    if (!v) {
      if (swapState.value?.fulfilled) {
        store.resetInput()
      }
      store.clearSwap()
    }
  },
})
</script>

<template>
  <SModal v-model:show="show">
    <KlayModalCard
      title="Confirm Swap"
      class="w-420px lt-sm:mx-2"
    >
      <KlayModalTemplateSubmitted v-if="swapState?.fulfilled" />
      <KlayModalTemplateError v-else-if="swapState?.rejected" />

      <div v-else>
        <ModuleSwapModalConfirmTokens />

        <ModuleSwapModalConfirmDetails class="mt-8 mb-4" />

        <KlayButton
          class="w-full"
          type="primary"
          size="lg"
          :loading="swapState?.pending"
          @click="store.swap()"
        >
          Confirm Swap
        </KlayButton>
      </div>
    </KlayModalCard>
  </SModal>
</template>
