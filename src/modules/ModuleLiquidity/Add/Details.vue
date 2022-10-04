<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { roundTo } from 'round-to'
import cssRows from '../../ModuleTradeShared/rows.module.scss'
import { buildPair, TOKEN_TYPES, nonNullPair } from '@/utils/pair'
import { NATIVE_TOKEN_DECIMALS, Wei, POOL_COMMISSION } from '@/core'
import { Ref } from 'vue'
import { KlayIconImportant } from '~klay-icons'

const props = defineProps<{
  inModal?: boolean
}>()

const cssRowClassForBottomLines = computed(() => {
  return props.inModal ? [cssRows.rowSm, cssRows.rowSmDimmed] : cssRows.rowSm
})

const store = useLiquidityAddStore()
const {
  finalRates: rates,
  symbols,
  tokens,
  formattedPoolShare,
  pairReserves: reserves,
  supplyScope,
} = storeToRefs(store)

const reservesAsTokens = computed(() => {
  const bothTokens = nonNullPair(tokens.value)
  const res = reserves.value
  if (!bothTokens || !res) return null

  return buildPair((type) => {
    const reserve = res[type === 'tokenA' ? 'reserve0' : 'reserve1']
    const num = reserve.decimals(bothTokens[type])
    return num
  })
})

const feeKlay = computed(() => {
  const wei = supplyScope.value?.fee
  if (!wei) return null
  return wei.decimals({ decimals: NATIVE_TOKEN_DECIMALS })
})

const formattedCommission = POOL_COMMISSION.toFormat()
</script>

<template>
  <div
    v-if="symbols.tokenA && symbols.tokenB"
    class="details p-4 space-y-4"
  >
    <h3>Prices and pool share</h3>

    <div class="space-y-4">
      <template v-if="inModal && reservesAsTokens">
        <div
          v-for="token in TOKEN_TYPES"
          :key="token"
          :class="cssRows.rowSm"
        >
          <span>{{ symbols[token] }} Deposited</span>
          <span>
            <CurrencyFormat
              :amount="reservesAsTokens[token]"
              :decimals="7"
            />
          </span>
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
          <span>Pool commission</span>
          <KlayIconImportant />
        </div>
        <span>{{ formattedCommission }}</span>
      </div>

      <div
        v-if="inModal && feeKlay"
        :class="cssRowClassForBottomLines"
      >
        <span>Transaction fee</span>
        <CurrencyFormat
          v-slot="{ formatted }"
          :amount="feeKlay"
          symbol="KLAY"
        >
          <span :title="formatted!">
            {{ formatted }}
          </span>
        </CurrencyFormat>
      </div>
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
