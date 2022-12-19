<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { TOKEN_TYPES } from '@/utils/pair'
import IconIcRoundPlus from '~icons/ic/round-plus'

const { selectedTokensData: tokens, amountsSlipped: amounts } = $(storeToRefs(useLiquidityRmStore()))

const rows = computed(() => {
  if (!amounts || !tokens) return null
  return TOKEN_TYPES.map((type) => {
    const tokenData = tokens[type]
    const { decimals, symbol } = tokenData
    const amount = amounts[type].decimals(tokenData)
    return { symbol, decimals, amount }
  })
})
</script>

<template>
  <div
    v-if="rows"
    class="space-y-3"
  >
    <h3>You will receive at least</h3>

    <div class="container">
      <template
        v-for="(row, i) in rows"
        :key="row.symbol"
      >
        <KlayCharAvatar
          class="avatar"
          :symbol="row.symbol"
          :data-i="i"
        />
        <span
          class="symbol"
          :data-i="i"
        >{{ row.symbol }}</span>

        <CurrencyFormatTruncate
          :amount="row.amount"
          :decimals="row.decimals"
          :class="$style.amount"
          :data-i="i"
          max-width="240"
        />

        <div
          v-if="i === 0"
          class="plus"
        >
          <IconIcRoundPlus />
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" module>
.amount {
  font-size: 30px;
  font-weight: 500;

  &[data-i='1'] {
    grid-row: 3;
    grid-column: 3;
  }
}
</style>

<style lang="scss" scoped>
.container {
  display: grid;
  grid-template-columns: repeat(2, max-content) 1fr;
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

.plus {
  grid-row: 2;
  grid-column: 2;
  font-size: 14px;
}

.avatar {
  &[data-i='1'] {
    grid-row: 3;
    grid-column: 1;
  }
}
</style>
