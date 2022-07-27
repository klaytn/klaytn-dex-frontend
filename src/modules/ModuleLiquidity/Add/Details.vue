<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { roundTo } from 'round-to'
import cssRows from '../../ModuleTradeShared/rows.module.scss'
import { POOL_COMISSION } from './const'
import { buildPair, TOKEN_TYPES } from '@/utils/pair'
import { NATIVE_TOKEN_DECIMALS } from '@/core/kaikas/const'
import { Ref } from 'vue'
import { Wei } from '@/core/kaikas'

const props = defineProps<{
  inModal?: boolean
}>()

const cssRowClassForBottomLines = computed(() => {
  return props.inModal ? [cssRows.rowSm, cssRows.rowSmDimmed] : cssRows.rowSm
})

const store = useLiquidityAddStore()
const { rates, symbols, tokens, formattedPoolShare, pairReserves: reserves, supplyScope } = storeToRefs(store)

const formattedReserves = reactive(
  buildPair((type) => {
    return computed(() => {
      if (reserves.value && tokens.value) {
        const token = tokens.value[type]!
        const reserve = reserves.value[type === 'tokenA' ? 'reserve0' : 'reserve1']
        const num = reserve.toToken(token)
        return String(roundTo(Number(num), 7))
      }
      return null
    })
  }),
)

const fee = computed(() => supplyScope.value?.fee ?? null)
const formattedFee = useFormattedToken(fee as Ref<null | Wei>, { decimals: NATIVE_TOKEN_DECIMALS }, 7)
const formattedComission = `${roundTo(POOL_COMISSION * 100, 2)}%`
</script>

<template>
  <div
    v-if="symbols.tokenA && symbols.tokenB"
    class="details p-4 space-y-4"
  >
    <h3>Prices and pool share</h3>

    <div class="space-y-4">
      <template v-if="inModal && formattedReserves.tokenA && formattedReserves.tokenB">
        <div
          v-for="token in TOKEN_TYPES"
          :key="token"
          :class="cssRows.rowSm"
        >
          <span>{{ symbols[token] }} Deposited</span>
          <span>{{ formattedReserves[token] }}</span>
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
          <IconKlayImportant />
        </div>
        <span>{{ formattedComission }}</span>
      </div>

      <div
        v-if="inModal && fee !== null"
        :class="cssRowClassForBottomLines"
      >
        <span>Transaction fee</span>
        <span>{{ formattedFee }} KLAY</span>
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
