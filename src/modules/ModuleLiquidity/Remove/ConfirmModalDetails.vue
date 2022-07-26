<script setup lang="ts">
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'
import cssRows from '../../ModuleTradeShared/rows.module.scss'

const store = useLiquidityRmStore()
const { formattedPoolShare, rates, selectedTokensSymbols: symbols, liquidityRaw, supplyGas } = storeToRefs(store)

const formattedLiquidity = computed(() => new BigNumber(liquidityRaw.value).toFixed(7))
</script>

<template>
  <div class="details p-4">
    <h3>Transaction details</h3>

    <div class="space-y-4 mt-6">
      <div :class="cssRows.rowSm">
        <span>LP {{ symbols?.tokenA }}-{{ symbols?.tokenB }} </span>
        <span>{{ formattedLiquidity }}</span>
      </div>

      <div :class="cssRows.rowSm">
        <span>Share of pool</span>
        <span>{{ formattedPoolShare }}</span>
      </div>

      <RowsRates
        :symbols="symbols!"
        :rounded-rates="rates!"
        :class="[cssRows.rowSm, cssRows.rowSmDimmed]"
      />

      <div :class="[cssRows.rowSm, cssRows.rowSmDimmed]">
        <span>Transaction Fee</span>
        <!-- TODO format -->
        <span> {{ supplyGas }}</span>
      </div>
    </div>

    <div class="klay-divider my-3" />

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
