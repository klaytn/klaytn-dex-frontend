<script setup lang="ts">
import { storeToRefs } from 'pinia'

const store = useLiquidityRmStore()
const { formattedPoolShare, rates, selectedTokensSymbols: symbols, liquidityRaw, supplyGas } = storeToRefs(store)
</script>

<template>
  <div class="details p-4 space-y-4">
    <h3>Transaction details</h3>

    <div class="space-y-4">
      <div class="row">
        <span>LP {{ symbols?.tokenA }}-{{ symbols?.tokenB }} </span>
        <!-- TODO format value -->
        <span>{{ liquidityRaw }}</span>
      </div>

      <div class="row">
        <span>Share of pool</span>
        <span>{{ formattedPoolShare }}</span>
      </div>

      <RowsRates
        :symbols="symbols!"
        :rounded-rates="rates!"
      />

      <div class="row row--dim">
        <span>Transaction Fee</span>
        <!-- TODO format -->
        <span> {{ supplyGas }}</span>
      </div>
    </div>

    <div class="divider" />

    <p>Output is estimated. If the price changes by more than 0.8% your transaction will revert.</p>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.details {
  border: 1px solid $gray5;
  border-radius: 8px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  font: {
    size: 12px;
    weight: 600;
  }
  color: $dark2;

  &--dim {
    color: $gray2;
    font-weight: 500;
  }
}

.divider {
  height: 1px;
  background: $gray5;
}

p {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2rem;
  color: $gray2;
}
</style>
