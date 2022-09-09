<route lang="yaml">
name: Swap
</route>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const swapStore = useSwapStore()
const { isValid, validationMessage, prepareState, gotAmountFor } = $(storeToRefs(swapStore))

const swapButtonLabel = $computed(() => {
  if (isValid) return 'Swap'
  return validationMessage
})

const isSwapDisabled = $computed(() => {
  return !isValid || !gotAmountFor
})

onUnmounted(() => swapStore.resetInput())
</script>

<template>
  <div class="space-y-4 pt-5 px-4">
    <ModuleSwapExchangeRate />

    <SlippageToleranceInput v-model="swapStore.slippageTolerance" />

    <KlayButton
      class="w-full"
      size="lg"
      :type="isSwapDisabled ? 'secondary' : 'primary'"
      :disabled="isSwapDisabled"
      :loading="prepareState?.pending"
      @click="swapStore.prepare()"
    >
      {{ swapButtonLabel }}
    </KlayButton>

    <ModuleSwapDetails />
  </div>

  <ModuleSwapModalConfirm />
</template>
