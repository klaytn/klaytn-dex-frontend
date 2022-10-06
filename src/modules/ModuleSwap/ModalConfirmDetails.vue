<script setup lang="ts">
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'
import cssRows from '../ModuleTradeShared/rows.module.scss'
import DetailsRowSlippage from './DetailsRowSlippage.vue'

const store = useSwapStore()
const { priceImpact, slippageDataParsed } = storeToRefs(store)

const formattedPriceImpact = computed(() => {
  return priceImpact.value?.toFormat(2, BigNumber.ROUND_UP) ?? null
})
</script>

<template>
  <div class="root py-4 space-y-4">
    <div class="px-4 space-y-4">
      <div :class="[cssRows.rowSm]">
        <span>Price</span>
        <span>?</span>
      </div>

      <DetailsRowSlippage :data="slippageDataParsed!" />

      <div :class="[cssRows.rowSm, cssRows.rowSmDimmed]">
        <span>Price Impact</span>
        <span>{{ formattedPriceImpact }}</span>
      </div>

      <div :class="[cssRows.rowSm, cssRows.rowSmDimmed]">
        <span>Network + LP Fee</span>
        <span>?</span>
      </div>
    </div>

    <div class="klay-divider" />

    <p class="px-4 note">
      Output is estimated. You will receive at least <i>... XXX</i>
      or the transaction will revert
    </p>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.root {
  border: 1px solid $gray5;
  border-radius: 8px;
}

.note {
  font-weight: 500;
  font-size: 12px;
  line-height: 180%;
  color: #8b93a1;
}
</style>
