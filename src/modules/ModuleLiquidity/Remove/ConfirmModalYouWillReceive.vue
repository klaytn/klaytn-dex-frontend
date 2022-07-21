<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { TOKEN_TYPES } from '@/utils/pair'
import { asWei, tokenWeiToRaw } from '@/core/kaikas'
import { roundTo } from 'round-to'
import IcRoundPlus from '~icons/ic/round-plus'

const { selectedTokensData: tokens, amounts } = $(storeToRefs(useLiquidityRmStore()))

const rows = computed(() => {
  if (!amounts || !tokens) return null
  return TOKEN_TYPES.map((type) => {
    const relative = tokenWeiToRaw(tokens[type], asWei(amounts[type].toString()))
    return { symbol: tokens[type].symbol, value: roundTo(Number(relative), 7) }
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
        <span
          class="amount"
          :data-i="i"
        >{{ row.value }}</span>

        <div
          v-if="i === 0"
          class="plus"
        >
          <IcRoundPlus />
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
