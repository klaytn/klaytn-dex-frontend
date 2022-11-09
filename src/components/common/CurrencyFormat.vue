<script setup lang="ts">
import { formatCurrency, useNormalizedComponentProps } from '@/utils/composable.currency-input'
import BigNumber from 'bignumber.js'
import { PropType } from 'vue'

const props = defineProps({
  amount: {
    type: [String, Number, BigNumber] as PropType<null | string | number | BigNumber>,
    default: null,
  },
  symbol: {
    type: String as PropType<null | string>,
    default: null,
  },
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
  // TODO replace everywhere, use this
  percent: Boolean,
})

const { decimals: decimalsNum, symbol: resolvedSymbol, amount: resolvedAmount } = useNormalizedComponentProps(props)

const formatted = computed(() =>
  resolvedAmount.value
    ? formatCurrency({
        amount: resolvedAmount.value,
        symbol: resolvedSymbol.value,
        decimals: decimalsNum.value,
      })
    : null,
)
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
