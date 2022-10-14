<script setup lang="ts">
import { storeToRefs } from 'pinia'
import cssRows from '../../ModuleTradeShared/rows.module.scss.types'
import { buildPair, TOKEN_TYPES, nonNullPair } from '@/utils/pair'
import { NATIVE_TOKEN_DECIMALS, POOL_COMMISSION } from '@/core'
import { KlayIconImportant } from '~klay-icons'
import { SPopover } from '@soramitsu-ui/ui'

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
        <div class="flex items-center">
          <span class="mr-1">Pool commission</span>

          <SPopover
            placement="bottom"
            distance="8"
          >
            <template #trigger>
              <span>
                <KlayIconImportant class="commission-info-icon" />
              </span>
            </template>

            <template #popper="{ show }">
              <div
                v-if="show"
                class="commission-card bg-white z-10 rounded-lg shadow-lg p-4 w-[305px]"
              >
                By adding liquidity you'll earn <b>{{ formattedCommission }}</b> of all trades on this pair proportional
                to your share of the pool. Fees are added to the pool, accrue in real time and can be claimed by
                withdrawing your liquidity.
              </div>
            </template>
          </SPopover>
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
@use '@/styles/vars';

.details {
  border: 1px solid #dfe4ed;
  border-radius: 8px;
}

h3 {
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  color: vars.$dark2;
}

.commission-info-icon {
  color: vars.$gray4;
}

.commission-card {
  color: vars.$gray2;
  font-weight: 500;
  font-size: 12px;
  line-height: 150%;

  b {
    color: vars.$dark;
    font-weight: 600;
  }
}
</style>
