<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<script setup lang="ts">
import { CURRENCY_USD } from '@/core'
import { MaskSymbol, formatCurrency, SYMBOL_USD } from '@/utils/composable.currency-input'
import BigNumber from 'bignumber.js'
import { SetRequired } from 'type-fest'
import { PropType } from 'vue'
import { SPopover } from '@soramitsu-ui/ui'

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
  maxWidth: {
    type: [String, Number] as PropType<string | number>,
    default: 100,
  },
})

const resolvedSymbol = computed<null | SetRequired<MaskSymbol, 'delimiter'>>(() =>
  props.usd
    ? SYMBOL_USD
    : props.symbol
    ? { str: props.symbol, delimiter: props.symbolDelimiter, position: props.symbolPosition }
    : null,
)

const decimalsNum = eagerComputed(() => {
  const d = props.decimals
  const decimals = typeof d === 'string' ? Number(d) : typeof d === 'number' ? d : undefined
  return decimals ?? (props.usd ? CURRENCY_USD.decimals : undefined)
})

const maxWidthPx = computed(() => `${props.maxWidth}px`)

const formattedAmountWithoutSymbol = computed(() =>
  props.amount ? formatCurrency({ amount: props.amount, decimals: decimalsNum.value }) : null,
)

const formattedAmount = computed(
  () =>
    props.amount && formatCurrency({ amount: props.amount, decimals: decimalsNum.value, symbol: resolvedSymbol.value }),
)
</script>

<template>
  <SPopover :trigger="amount ? 'hover' : 'manual'">
    <template #trigger>
      <span
        class="truncated-wrap"
        :class="{ 'no-value': !amount }"
        v-bind="$attrs"
      >
        <template v-if="amount">
          <template v-if="!resolvedSymbol"><span class="amount">{{ formattedAmountWithoutSymbol }}</span></template>
          <template v-else-if="resolvedSymbol.position === 'left'">
            <span class="whitespace-pre">{{ resolvedSymbol.str + resolvedSymbol.delimiter }}</span><span class="amount">{{ formattedAmountWithoutSymbol }}</span>
          </template>
          <template v-else>
            <span class="amount">{{ formattedAmountWithoutSymbol }}</span><span class="whitespace-pre">{{ resolvedSymbol.delimiter + resolvedSymbol.str }}</span>
          </template>
        </template>
        <template v-else>&mdash;</template>
      </span>
    </template>

    <template #popper="{ show }">
      <div
        v-if="show"
        class="popper select-text px-2 py-1 bg-white rounded-md shadow-md cursor-text"
      >
        {{ formattedAmount }}
      </div>
    </template>
  </SPopover>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.truncated-wrap {
  display: inline-flex;
  align-items: center;

  span {
    display: inline-block;
  }

  &:hover:not(.no-value) {
    background: vars.$blue-light3;
  }
}

.amount {
  max-width: v-bind(maxWidthPx);
  overflow: hidden;
  -o-text-overflow: ellipsis;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popper {
  border: 1px solid vars.$gray5; // same as .klay-divider
  z-index: 10;
}
</style>
