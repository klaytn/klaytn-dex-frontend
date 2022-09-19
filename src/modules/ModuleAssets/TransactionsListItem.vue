<script setup lang="ts">
import { WeiAsToken } from '@/core'
import { buildPair } from '@/utils/pair'
import { parseSwapAmounts, TransactionEnum } from './query.transactions'

const props = defineProps<{
  item: TransactionEnum
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
  return kind === 'burn' ? 'Burn' : kind === 'mint' ? 'Mint' : 'Swap'
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
    return { kind: 'mint-burn' as const, liquidity: item.liquidity, pair: item.pair }
  }

  const ty: never = item
  throw new Error('unreachable')
})
</script>

<template>
  <div
    class="px-4 py-2 cursor-pointer select-none"
    :class="$style.root"
  >
    <div class="font-semibold text-sm flex items-center space-x-2">
      <span :class="$style.kind">{{ kindFormatted }}</span>
      <div class="flex items-center space-x-1">
        <template v-if="detailsParsed.kind === 'swap'">
          <ModuleAssetsTransactionsListItemSwapAmount v-bind="detailsParsed.tokenA" />
          <span> for </span>
          <ModuleAssetsTransactionsListItemSwapAmount v-bind="detailsParsed.tokenB" />
        </template>
        <template v-else>
          <span>{{ detailsParsed.pair.token0.symbol }}-{{ detailsParsed.pair.token1.symbol }}</span>
          <span class="max-w-40 inline-block truncate">
            <CurrencyFormat
              :amount="detailsParsed.liquidity"
              decimals="18"
              symbol="?"
            />
          </span>
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
  &:hover {
    background: vars.$gray7;
  }
}

.timestamp {
  color: vars.$gray2;
}

.kind {
  color: vars.$blue;
}
</style>
