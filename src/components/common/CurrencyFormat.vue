<script setup lang="ts">
import { formatCurrency } from '@/utils/composable.currency-input'
import BigNumber from 'bignumber.js'

const props = withDefaults(
  defineProps<{
    amount?: string | number | BigNumber
    symbol?: string
    symbolPosition?: 'left' | 'right'
    symbolDelimiter?: string
    decimals?: number
  }>(),
  {
    symbolPosition: 'right',
    symbolDelimiter: ' ',
  },
)

const formatted = computed(() => {
  return props.amount
    ? formatCurrency({
        amount: props.amount,
        symbol: props.symbol
          ? {
              str: props.symbol,
              position: props.symbolPosition,
              delimiter: props.symbolDelimiter,
            }
          : null,
        decimals: props.decimals,
      })
    : null
})
</script>

<template>
  <slot v-bind="{ formatted }">
    <template v-if="formatted">
      {{ formatted }}
    </template>
    <template v-else>
      &mdash;
    </template>
  </slot>
</template>
