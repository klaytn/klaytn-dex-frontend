<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<script setup lang="ts">
import { CurrencySymbol } from '@/core'
import { TokensPair, TOKEN_TYPES, mirrorTokenType, TokenType } from '@/utils/pair'
import { RatesRounded } from '@/utils/common'

const props = defineProps<{
  symbols: TokensPair<CurrencySymbol>
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
    v-bind="$attrs"
  >
    <span>
      {{ symbols[token] }}
      per
      {{ symbols[mirrorTokenType(token)] }}
    </span>
    <span><CurrencyFormat :amount="rateByTokenType(token)" /></span>
  </div>
</template>
