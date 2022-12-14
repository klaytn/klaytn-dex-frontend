<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<script setup lang="ts">
import { formatCurrency, useNormalizedComponentProps } from '@/utils/composable.currency-input'
import BigNumber from 'bignumber.js'
import { PropType } from 'vue'
import { SPopover } from '@soramitsu-ui/ui'

const props = defineProps({
  amount: {
    type: [String, Number, BigNumber] as PropType<null | string | number | BigNumber>,
    default: null,
  },
  symbol: {
    type: String as PropType<string | null>,
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
  decimalsPopover: {
    type: [String, Number] as PropType<string | number | null>,
    default: null,
  },
  usd: Boolean,
  percent: Boolean,
  maxWidth: {
    type: [String, Number] as PropType<string | number>,
    default: 100,
  },
})

const {
  symbol: resolvedSymbol,
  decimals: resolvedDecimals,
  decimalsPopover: resolvedDecimalsPopover,
  amount: resolvedAmount,
} = useNormalizedComponentProps(props)

const maxWidthString = computed(() => {
  const maxWidthNumber = Number(props.maxWidth)
  if (!isNaN(maxWidthNumber)) {
    return maxWidthNumber + 'px'
  } else {
    return props.maxWidth
  }
})

const formattedAmountWithoutSymbol = computed(() =>
  resolvedAmount.value
    ? formatCurrency({
        amount: resolvedAmount.value,
        decimals: resolvedDecimals.value,
        significant: props.usd || props.percent ? SIGNIFICANT : null,
      })
    : null,
)

const SIGNIFICANT = 7

const formattedAmountPopover = computed(
  () =>
    resolvedAmount.value &&
    formatCurrency({
      amount: resolvedAmount.value,
      decimals: resolvedDecimalsPopover.value,
      symbol: resolvedSymbol.value,
      significant: props.usd || props.percent ? SIGNIFICANT : null,
    }),
)
</script>

<template>
  <SPopover :trigger="amount ? 'hover' : 'manual'">
    <template #trigger>
      <span
        class="inline-flex items-center max-w-full"
        :class="[$style.truncatedWrap, { 'no-value': !amount }]"
        v-bind="$attrs"
      >
        <template v-if="amount">
          <template v-if="!resolvedSymbol"><span :class="$style.amount">{{ formattedAmountWithoutSymbol }}</span></template>
          <template v-else-if="resolvedSymbol.position === 'left'">
            <span class="whitespace-pre">{{ resolvedSymbol.str + resolvedSymbol.delimiter }}</span><span :class="$style.amount">{{ formattedAmountWithoutSymbol }}</span>
          </template>
          <template v-else>
            <span :class="$style.amount">{{ formattedAmountWithoutSymbol }}</span><span class="whitespace-pre">{{ resolvedSymbol.delimiter + resolvedSymbol.str }}</span>
          </template>
        </template>
        <template v-else>&mdash;</template>
      </span>
    </template>

    <template #popper="{ show }">
      <div
        v-if="show"
        :class="$style.popper"
        class="select-text px-2 py-1 bg-white rounded-md shadow-md cursor-text"
      >
        {{ formattedAmountPopover }}
      </div>
    </template>
  </SPopover>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.truncated-wrap {
  span {
    display: inline-block;
  }

  &:hover:not(.no-value) {
    background: vars.$blue-light3;
  }
}

.amount {
  max-width: v-bind(maxWidthString);
  overflow: hidden;
  -o-text-overflow: ellipsis;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popper {
  border: 1px solid vars.$gray5; // same as .klay-divider
  z-index: 10;
  max-width: 300px;
  word-wrap: break-word;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.3em;
}
</style>
