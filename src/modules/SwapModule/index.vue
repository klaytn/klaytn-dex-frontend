<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const tokensStore = useTokensStore()
const { areImportedTokensLoaded } = $(storeToRefs(tokensStore))

const swapStore = useSwapStore()
const { isValid, validationMessage, swapState, gotAmountFor } = $(storeToRefs(swapStore))

const swapButtonLabel = $computed(() => {
  if (isValid) return 'Swap'
  return validationMessage
})

onBeforeUnmount(() => {
  swapStore.reset()
})

const isSwapDisabled = $computed(() => {
  return !isValid || !gotAmountFor
})
</script>

<template>
  <KlayWrap>
    <div
      v-if="!areImportedTokensLoaded"
      class="p-8 flex items-center justify-center"
    >
      <KlayLoader />
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <SwapModuleExchangeRate />

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

      <SwapModuleDetails />
    </div>
  </KlayWrap>
</template>
