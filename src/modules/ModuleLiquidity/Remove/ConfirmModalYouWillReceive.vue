<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { TOKEN_TYPES } from '@/utils/pair'
import IconIcRoundPlus from '~icons/ic/round-plus'

const { selectedTokensData: tokens, amounts } = $(storeToRefs(useLiquidityRmStore()))

const rows = computed(() => {
  if (!amounts || !tokens) return null
  return TOKEN_TYPES.map((type) => {
    const token = amounts[type].decimals(tokens[type])
    return { symbol: tokens[type].symbol, token }
  })
})
</script>

<template>
  <div
    v-if="rows"
    class="space-y-3"
  >
    <h3>You will receive</h3>

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

        <CurrencyFormat
          v-slot="{ formatted }"
          :amount="row.token"
        >
          <span
            class="amount truncate max-w-60"
            :data-i="i"
            :title="formatted!"
          >{{ formatted }}</span>
        </CurrencyFormat>

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

  &[data-i='1'] {
    grid-row: 3;
    grid-column: 3;
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
