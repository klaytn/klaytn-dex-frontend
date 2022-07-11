<route lang="yaml">
name: Swap
</route>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const swapStore = useSwapStore()
const { isValid, validationMessage, swapState, gotAmountFor } = $(storeToRefs(swapStore))

const swapButtonLabel = $computed(() => {
  if (isValid) return 'Swap'
  return validationMessage
})

const isSwapDisabled = $computed(() => {
  return !isValid || !gotAmountFor
})
</script>

<template>
  <div class="space-y-4 py-5 px-4">
    <ModuleSwapExchangeRate />

    <KlayButton
      class="w-full"
      size="lg"
      :type="isSwapDisabled ? 'secondary' : 'primary'"
      :disabled="isSwapDisabled"
      :loading="swapState.pending"
      @click="swapStore.swap"
    >
      {{ swapButtonLabel }}
    </KlayButton>

    <ModuleSwapDetails />
  </div>
</template>
