<script setup lang="ts">
import { SModal } from '@soramitsu-ui/ui'
import { storeToRefs } from 'pinia'

const store = useSwapStore()
const { swapState } = storeToRefs(store)

const show = computed({
  get: () => store.prepareState?.fulfilled,
  set: (v) => !v && store.clearSwap(),
})
</script>

<template>
  <SModal v-model:show="show">
    <KlayModalCard
      title="Confirm Swap"
      class="w-[420px]"
    >
      <KlayModalTemplateSubmitted v-if="swapState?.fulfilled" />
      <KlayModalTemplateError v-else-if="swapState?.rejected" />

      <div
        v-else
        class="space-y-4"
      >
        <div>tokens here</div>

        <div>details here</div>

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
