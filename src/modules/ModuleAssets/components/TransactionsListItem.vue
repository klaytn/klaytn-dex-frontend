<script setup lang="ts">
import { WeiAsToken } from '@/core'
import { buildPair } from '@/utils/pair'
import { TransactionEnum, parseSwapAmounts } from '../query.transactions'

const props = defineProps<{
  item: TransactionEnum
  height?: string | number
  hasDivider?: boolean
}>()

const timestampFormat = new Intl.DateTimeFormat('en', {
  timeStyle: 'medium',
  dateStyle: 'medium',
})

const timestampFormatted = computed(() => {
  const ms = Number(props.item.timestamp) * 1000
  return timestampFormat.format(ms)
})

const kindFormatted = computed(() => {
  const {
    item: { kind },
  } = props
  return kind === 'burn' ? 'Remove' : kind === 'mint' ? 'Receive' : 'Swap'
})

interface SwapAmountCooked {
  symbol: string
  amount: WeiAsToken<string>
  decimals: number
}

const detailsParsed = computed(() => {
  const { item } = props

  if (item.kind === 'swap') {
    const amounts = parseSwapAmounts(item)

    const tokens = buildPair<SwapAmountCooked>((type) => {
      const { token, amount } = amounts[type === 'tokenA' ? 'in' : 'out']
      const { symbol, decimals: decimalsStr } = item.pair[token]
      const decimals = Number(decimalsStr)
      return { amount, symbol, decimals }
    })

    return { kind: 'swap' as const, ...tokens }
  } else if (item.kind === 'burn' || item.kind === 'mint') {
    return {
      kind: 'mint-burn' as const,
      liquidity: item.liquidity,
      symbol: `${item.pair.token0.symbol}-${item.pair.token1.symbol}`,
    }
  }

  // eslint-disable-next-line no-unused-vars
  const ty: never = item
  throw new Error('unreachable')
})
</script>

<template>
  <div
    class="px-4 flex flex-col justify-center cursor-pointer select-none"
    :class="[$style.root, { [$style.hasDivider]: hasDivider }]"
    :style="{ height: `${height}px` }"
  >
    <div class="font-semibold text-sm flex items-center space-x-2">
      <span :class="$style.kind">{{ kindFormatted }}</span>
      <div
        class="flex items-center min-w-0"
        @click.stop
      >
        <template v-if="detailsParsed.kind === 'swap'">
          <CurrencyFormatTruncate v-bind="detailsParsed.tokenA" />
          <span class="whitespace-pre"> for </span>
          <CurrencyFormatTruncate v-bind="detailsParsed.tokenB" />
        </template>
        <template v-else>
          <CurrencyFormatTruncate
            class="overflow-hidden"
            :symbol="detailsParsed.symbol"
            :amount="detailsParsed.liquidity"
            decimals="18"
            max-width="auto"
          />
        </template>
      </div>
    </div>
    <span
      class="text-sm"
      :class="$style.timestamp"
    >
      {{ timestampFormatted }}
    </span>
  </div>
</template>

<style module lang="scss">
@use '@/styles/vars';

.root {
  position: relative;

  &:hover {
    background: vars.$gray7;
  }
}

.has-divider {
  &::before {
    content: '';
    position: absolute;
    left: 16px;
    right: 16px;
    top: 0;
    height: 1px;
    background: vars.$gray5;
  }
}

.timestamp {
  color: vars.$gray2;
}

.kind {
  color: vars.$blue;
}
</style>
