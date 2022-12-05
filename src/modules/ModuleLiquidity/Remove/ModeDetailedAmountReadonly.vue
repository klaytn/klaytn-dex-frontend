<script setup lang="ts">
import { Token, Wei } from '@/core'

const props = defineProps<{
  token?: Token | null
  amount?: Wei | null
  isLoading?: boolean
}>()

const amountAsToken = computed(() => (props.token && props.amount && props.amount.decimals(props.token)) ?? null)
</script>

<template>
  <InputCurrencyTemplate :loading="isLoading">
    <template #input>
      <CurrencyFormat
        v-slot="{ formatted }"
        :amount="amountAsToken"
      >
        <input
          readonly
          :value="formatted"
          placeholder="—"
        >
      </CurrencyFormat>
    </template>

    <template #top-right>
      <div
        v-if="token"
        class="flex items-center space-x-2"
      >
        <KlayCharAvatar :symbol="token.symbol" />
        <span class="token-symbol">{{ token.symbol }}</span>
      </div>
    </template>
  </InputCurrencyTemplate>
</template>

<style lang="scss">
@use '@/styles/vars';

.token-symbol {
  color: vars.$dark2;
  font-weight: 600;
  font-size: 14px;
}
</style>
