<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { roundTo } from 'round-to'
import cssRows from '../rows.module.scss'
import { POOL_COMISSION } from './const'
import { TOKEN_TYPES } from '@/utils/pair'
import { KlayIconImportant } from '~klay-icons'

const props = defineProps<{
  inModal?: boolean
}>()

const cssRowClassForBottomLines = computed(() => {
  return props.inModal ? [cssRows.rowSm, cssRows.rowSmDimmed] : cssRows.rowSm
})

const store = useLiquidityAddStore()
const { rates, selectionTokensSymbols: symbols, formattedPoolShare, pairReserves: reserves } = storeToRefs(store)

const formattedComission = `${roundTo(POOL_COMISSION * 100, 2)}%`
</script>

<template>
  <div
    v-if="symbols"
    class="details p-4 space-y-4"
  >
    <h3>Prices and pool share</h3>

    <div class="space-y-4">
      <template v-if="inModal && reserves">
        <div
          v-for="token in TOKEN_TYPES"
          :key="token"
          :class="cssRows.rowSm"
        >
          <span>{{ symbols[token] }} Deposited</span>
          <span>{{ reserves[token === 'tokenA' ? 'reserve0' : 'reserve1'] }}</span>
        </div>
      </template>

      <RowsRates
        :class="cssRowClassForBottomLines"
        :symbols="symbols"
        :rounded-rates="rates"
      />

      <div :class="cssRowClassForBottomLines">
        <span>Share of pool</span>
        <span>
          <ValueOrDash :value="formattedPoolShare" />
        </span>
      </div>

      <div :class="cssRowClassForBottomLines">
        <div class="flex items-center space-x-1">
          <span>Pool comission</span>
          <KlayIconImportant />
        </div>
        <span>{{ formattedComission }}</span>
      </div>

      <!-- TODO: gas price, or transaction fee -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.details {
  border: 1px solid #dfe4ed;
  border-radius: 8px;
}

h3 {
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  color: $dark2;
}
</style>
