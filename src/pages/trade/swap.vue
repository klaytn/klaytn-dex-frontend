<route lang="yaml">
name: Swap
</route>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { ValidationError } from '@/modules/ModuleSwap/composable.validation'
import invariant from 'tiny-invariant'

const swapStore = useSwapStore()
const { isValid, validationError, isValidationPending, prepareState, gotAmountFor, tokens } = $(storeToRefs(swapStore))

const whoseBalanceIsInsufficient = () => {
  const { tokenA } = tokens
  invariant(tokenA)
  return tokenA.symbol
}

const whichRouteNotFound = () => {
  const { tokenA, tokenB } = tokens
  invariant(tokenA && tokenB)
  return tokenA.symbol + ' > ' + tokenB.symbol
}

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
      <template v-if="isValidationPending">
        ...
      </template>
      <template v-else-if="validationError">
        <template v-if="validationError === ValidationError.UnselectedTokens">
          Select tokens
        </template>
        <template v-else-if="validationError === ValidationError.WalletIsNotConnected">
          Connect wallet
        </template>
        <template v-else-if="validationError === ValidationError.InsufficientBalanceOfInputToken">
          Insufficient {{ whoseBalanceIsInsufficient() }} balance
        </template>
        <template v-else-if="validationError === ValidationError.RouteNotFound">
          Route {{ whichRouteNotFound() }} not found
        </template>
      </template>
      <template v-else>
        Swap
      </template>
    </KlayButton>

    <ModuleSwapDetails />
  </div>

  <ModuleSwapModalConfirm />
</template>
