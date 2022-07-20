<script setup lang="ts">
import { TokenSymbol } from '@/core/kaikas'
import { TokensPair, TOKEN_TYPES, mirrorTokenType, TokenType } from '@/utils/pair'
import { RatesRounded } from '@/utils/common'

const props = defineProps<{
  symbols: TokensPair<TokenSymbol>
  roundedRates?: RatesRounded
}>()

function rateByTokenType(type: TokenType) {
  return props.roundedRates?.[type === 'tokenA' ? 'a_per_b' : 'b_per_a']
}
</script>

<template>
  <div
    v-for="token in TOKEN_TYPES"
    :key="token"
    class="row flex justify-between items-center"
  >
    <span>
      {{ symbols[token] }}
      per
      {{ symbols[mirrorTokenType(token)] }}
    </span>
    <span> <ValueOrDash :value="rateByTokenType(token)" /></span>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.row {
  font-size: 12px;
  font-weight: 500;
  color: $gray2;
}
</style>
