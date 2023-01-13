<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { ValidationError } from '@/modules/ModuleSwap/composable.validation'
import invariant from 'tiny-invariant'
import { useTradeStore } from '@/modules/ModuleTradeShared/trade-store'
import { P, match } from 'ts-pattern'

const swapStore = useSwapStore()
const { isValid, validationError, isValidationPending, prepareState, gotAmountFor, tokens, isRefreshing } =
  storeToRefs(swapStore)

const whoseBalanceIsInsufficient = () => {
  const { tokenA } = tokens.value
  invariant(tokenA)
  return tokenA.symbol
}

const whichRouteNotFound = () => {
  const { tokenA, tokenB } = tokens.value
  invariant(tokenA && tokenB)
  return tokenA.symbol + ' > ' + tokenB.symbol
}

const isSwapDisabled = $computed(() => {
  return !isValid.value || !gotAmountFor.value
})

onUnmounted(() => swapStore.resetInput())

useTradeStore().useRefresh({
  run: () => swapStore.refresh(),
  pending: isRefreshing,
})

const buttonLabel = computed<string | null>(() =>
  isValidationPending.value
    ? null
    : match(validationError.value)
        .with(P.nullish, ValidationError.JustNotReady, () => 'Swap')
        .with(ValidationError.UnselectedTokens, () => 'Select tokens')
        .with(ValidationError.RouteNotFound, () => `Route ${whichRouteNotFound()} not found`)
        .with(ValidationError.WalletIsNotConnected, () => 'Connect wallet')
        .with(ValidationError.PriceImpactIsTooHigh, () => 'Too much impact')
        .with(
          ValidationError.InsufficientBalanceOfInputToken,
          () => `Insufficient ${whoseBalanceIsInsufficient()} balance`,
        )
        .exhaustive(),
)
</script>

<template>
  <div class="space-y-4 pt-5 px-4">
    <ModuleSwapExchangeRate />

    <SlippageToleranceInput v-model="swapStore.slippageNumeric" />

    <KlayButton
      class="w-full"
      size="lg"
      :type="isSwapDisabled ? 'secondary' : 'primary'"
      :disabled="isSwapDisabled"
      :loading="prepareState?.pending ?? isValidationPending"
      @click="swapStore.prepare()"
    >
      {{ buttonLabel }}
    </KlayButton>

    <ModuleSwapDetails />
  </div>

  <ModuleSwapModalConfirm />
</template>
