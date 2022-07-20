<script setup lang="ts">
import { storeToRefs } from 'pinia'
import cssRows from '../rows.module.scss'

const store = useLiquidityRmStore()
const { formattedPoolShare, rates, selectedTokensSymbols: symbols, liquidityRaw, supplyGas } = storeToRefs(store)
</script>

<template>
  <div class="details p-4 space-y-4">
    <h3>Transaction details</h3>

    <div class="space-y-4">
      <div :class="cssRows.rowMd">
        <span>LP {{ symbols?.tokenA }}-{{ symbols?.tokenB }} </span>
        <!-- TODO format value -->
        <span>{{ liquidityRaw }}</span>
      </div>

      <div :class="cssRows.rowMd">
        <span>Share of pool</span>
        <span>{{ formattedPoolShare }}</span>
      </div>

      <RowsRates
        :symbols="symbols!"
        :rounded-rates="rates!"
      />

      <div :class="[cssRows.rowMd, cssRows.rowMdDimmed]">
        <span>Transaction Fee</span>
        <!-- TODO format -->
        <span> {{ supplyGas }}</span>
      </div>
    </div>

    <div class="klay-divider" />

    <p>Output is estimated. If the price changes by more than 0.8% your transaction will revert.</p>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.details {
  border: 1px solid $gray5;
  border-radius: 8px;
}

p {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2rem;
  color: $gray2;
}
</style>
