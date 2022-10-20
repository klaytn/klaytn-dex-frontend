<script setup lang="ts" name="SwapModuleDetails">
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'
import cssRows from '../ModuleTradeShared/rows.module.scss.types'
import DetailsRowSlippage from './DetailsRowSlippage.vue'
import DetailsRowFee from './DetailsRowFee.vue'

const store = useSwapStore()
const { finalRates: rates, symbols, trade, priceImpact, slippageDataParsed, feeArray: fee } = storeToRefs(store)

const bothSymbols = computed(() => {
  const { tokenA, tokenB } = symbols.value || {}
  if (tokenA && tokenB) return { tokenA, tokenB }
  return null
})

const formattedPriceImpact = computed(() => {
  return priceImpact.value?.toFormat(2, BigNumber.ROUND_UP) ?? null
})
</script>

<template>
  <div v-if="trade && bothSymbols && formattedPriceImpact">
    <KlayCollapse>
      <template #head>
        <h3 class="py-2">
          Transaction Details
        </h3>
      </template>
      <template #main>
        <div class="space-y-4 pt-2">
          <RowsRates
            :class="cssRows.rowSm"
            :rounded-rates="rates"
            :symbols="bothSymbols"
          />

          <DetailsRowSlippage
            v-if="slippageDataParsed"
            :data="slippageDataParsed"
          />

          <div :class="[cssRows.rowSm, cssRows.rowSmDimmed]">
            <span>Price Impact</span>
            <span>
              <ValueOrDash :value="formattedPriceImpact" />
            </span>
          </div>

          <div :class="[cssRows.rowSm, cssRows.rowSmDimmed]">
            <span>Route</span>
            <span>
              {{ trade.route.toString() }}
            </span>
          </div>

          <DetailsRowFee
            v-if="fee"
            :data="fee"
          />
        </div>
      </template>
    </KlayCollapse>
  </div>
</template>
