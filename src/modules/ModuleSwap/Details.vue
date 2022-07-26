<script setup lang="ts" name="SwapModuleDetails">
import { storeToRefs } from 'pinia'
import cssRows from '../ModuleTradeShared/rows.module.scss'

const store = useSwapStore()
const { rates, symbols } = storeToRefs(store)

const bothSymbols = computed(() => {
  const { tokenA, tokenB } = symbols.value || {}
  if (tokenA && tokenB) return { tokenA, tokenB }
  return null
})

const route = computed(() => {
  const { tokenA, tokenB } = bothSymbols.value || {}
  if (!tokenA || !tokenB) return null
  return `${tokenA} > ${tokenB}`
})
</script>

<template>
  <div v-if="bothSymbols">
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

          <!-- Not in design -->
          <!-- <div class="details--row">
            <span>Share of pool</span>
            <span>
              <ValueOrDash :value="formattedPoolShare" />
            </span>
          </div> -->

          <div :class="[cssRows.rowSm, cssRows.rowSmDimmed]">
            <span>Route</span>
            <span>
              <ValueOrDash :value="route" />
            </span>
          </div>
        </div>
      </template>
    </KlayCollapse>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/vars';

.details {
  // margin-top: 8px;

  // &--title,
  // h3 {
  //   font-style: normal;
  //   font-weight: 700;
  //   font-size: 14px;
  //   line-height: 17px;
  //   color: $dark2;
  //   padding: 3px 0;
  // }

  // &--wrap {
  //   margin-top: 16px;
  // }

  // &--row {
  //   display: flex;
  //   justify-content: space-between;
  //   font-style: normal;
  //   font-weight: 600;
  //   font-size: 12px;
  //   line-height: 230%;
  //   color: $dark2;
  // }
}
</style>
