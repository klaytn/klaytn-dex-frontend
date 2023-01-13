<script setup lang="ts">
import { TOKEN_TYPES, buildPair, nonNullPair } from '@/utils/pair'
import { storeToRefs } from 'pinia'

const store = useSwapStore()
const { gotAmountsResult, tokens, symbols } = storeToRefs(store)

const bothSymbols = computed(() => nonNullPair(symbols.value))

const amountsAsTokens = computed(() => {
  const tokensVal = nonNullPair(tokens.value)
  const amounts = gotAmountsResult.value?.amountsResult
  return (
    amounts &&
    tokensVal &&
    buildPair((type) => {
      const wei = amounts[type === 'tokenA' ? 'amountIn' : 'amountOut']
      const token = tokensVal[type]
      return wei.decimals(token)
    })
  )
})
</script>

<template>
  <div
    v-if="bothSymbols && amountsAsTokens"
    class="container"
  >
    <template
      v-for="(type, i) in TOKEN_TYPES"
      :key="type"
    >
      <KlayCharAvatar
        class="avatar"
        :symbol="bothSymbols[type]"
        :data-i="i"
      />
      <span
        class="symbol"
        :data-i="i"
      >{{ bothSymbols[type] }}</span>
      <div
        class="amount"
        :data-i="i"
      >
        <CurrencyFormatTruncate
          :amount="amountsAsTokens[type]"
          max-width="270"
        />
      </div>

      <div
        v-if="i === 0"
        class="arrow"
      >
        <svg
          width="14"
          height="22"
          viewBox="0 0 14 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M5.74507 1.00195C5.74507 0.448589 6.19366 0 6.74702 0C7.30038 0 7.74897 0.44859 7.74897 1.00195V18.5601L11.478 14.831C11.8693 14.4398 12.5037 14.4398 12.895 14.831C13.2863 15.2223 13.2863 15.8567 12.895 16.248L7.45564 21.6874C7.26 21.883 7.00358 21.9808 6.74715 21.9808C6.68592 21.9808 6.62469 21.9753 6.56428 21.9641C6.37169 21.9286 6.18751 21.8363 6.03856 21.6874L0.587655 16.2365C0.196368 15.8452 0.196368 15.2108 0.587655 14.8195C0.978942 14.4282 1.61334 14.4282 2.00463 14.8195L5.74507 18.5599V1.00195Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: grid;
  grid-template-columns: repeat(3, max-content);
  column-gap: 8px;
  row-gap: 8px;
  align-items: center;
}

.symbol {
  font-size: 18px;
  font-weight: 700;

  &[data-i='1'] {
    grid-row: 3;
    grid-column: 2;
  }
}

.amount {
  font-size: 30px;
  font-weight: 500;
  margin-left: 16px;

  &[data-i='1'] {
    grid-row: 3;
    grid-column: 3;
  }
}

.arrow {
  grid-row: 2;
  grid-column: 2;
  font-size: 14px;
  place-self: center;
}

.avatar {
  &[data-i='1'] {
    grid-row: 3;
    grid-column: 1;
  }
}
</style>
