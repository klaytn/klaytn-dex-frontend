<script setup lang="ts">
import { Token, Wei } from '@/core'
import { roundTo } from 'round-to'

const props = defineProps<{
  token?: Token | null
  amount?: Wei | null
  isLoading?: boolean
}>()

const roundedTokenRelativeAmount = computed(() => {
  const { token, amount } = props
  if (token && amount) {
    const value = amount.toToken(token)
    return roundTo(Number(value), 7)
  }
  return null
})
</script>

<template>
  <InputCurrencyTemplate
    :model-value="roundedTokenRelativeAmount?.toString()"
    input-readonly
    :input-loading="isLoading"
  >
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
@import '@/styles/vars';

.token-symbol {
  color: $dark2;
  font-weight: 600;
  font-size: 14px;
}
</style>
