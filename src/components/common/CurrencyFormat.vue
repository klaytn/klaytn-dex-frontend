<script setup lang="ts">
import { formatCurrency } from '@/utils/composable.currency-input'
import BigNumber from 'bignumber.js'
import { PropType } from 'vue'

const props = defineProps({
  amount: {
    type: [String, Number, BigNumber] as PropType<null | string | number | BigNumber>,
    default: null,
  },
  symbol: String,
  symbolPosition: {
    type: String as PropType<'left' | 'right'>,
    default: 'right',
  },
  symbolDelimiter: {
    type: String,
    default: ' ',
  },
  decimals: {
    type: [String, Number] as PropType<string | number | null>,
    default: null,
  },
  usd: Boolean,
})

const decimalsNum = eagerComputed(() => {
  const value = props.decimals
  return typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : undefined
})

const formatted = computed(() => {
  return props.amount
    ? formatCurrency({
        amount: props.amount,
        symbol: props.usd
          ? { str: '$', position: 'left', delimiter: '' }
          : props.symbol
          ? {
              str: props.symbol,
              position: props.symbolPosition,
              delimiter: props.symbolDelimiter,
            }
          : null,
        decimals: decimalsNum.value,
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
