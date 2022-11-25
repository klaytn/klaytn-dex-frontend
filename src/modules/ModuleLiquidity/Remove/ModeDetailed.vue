<script lang="ts" setup>
import { TOKEN_TYPES } from '@/utils/pair'
import { storeToRefs } from 'pinia'
import cssRows from '../../ModuleTradeShared/rows.module.scss'
import { KlayIconArrowDown, KlayIconPlus } from '~klay-icons'
import { LP_TOKEN_DECIMALS, Wei, WeiAsToken } from '@/core'
import BigNumber from 'bignumber.js'
import InputTokenLp from '@/components/InputTokenLp.vue'

const store = useLiquidityRmStore()
const {
  rates,
  selectedTokensSymbols: symbols,
  liquidity,
  selectedTokensData: tokens,
  amounts,
  pairUserBalance,
  isAmountsPending,
} = storeToRefs(store)

const LP_TOKEN_ONLY_DECIMALS = { decimals: LP_TOKEN_DECIMALS }

const liquidityAsBigNum = computed<WeiAsToken<BigNumber>>({
  get: () => {
    const token = liquidity.value?.decimals(LP_TOKEN_ONLY_DECIMALS)
    return token ?? (new BigNumber(0) as WeiAsToken<BigNumber>)
  },
  set: (v) => {
    liquidity.value = v && Wei.fromToken(LP_TOKEN_ONLY_DECIMALS, v)
  },
})

const balanceAsBigNum = computed(() => pairUserBalance.value?.decimals(LP_TOKEN_ONLY_DECIMALS))
</script>

<template>
  <div v-if="tokens && symbols">
    <InputTokenLp
      v-model="liquidityAsBigNum"
      :symbols="symbols"
      @click:max="store.setLiquidityToMax()"
    >
      <template #bottom-right>
        <div :class="[$style.balance, 'flex items-center']">
          <pre>Balance: </pre>
          <CurrencyFormatTruncate :amount="balanceAsBigNum" />
        </div>
      </template>
    </InputTokenLp>

    <div class="flex justify-center">
      <KlayIconArrowDown />
    </div>

    <template
      v-for="(token, i) in TOKEN_TYPES"
      :key="token"
    >
      <ModuleLiquidityRemoveModeDetailedAmountReadonly
        :token="tokens[token]"
        :amount="amounts?.[token]"
        :is-loading="isAmountsPending"
      />

      <div
        v-if="i === 0"
        class="flex justify-center -my-2"
      >
        <KlayIconPlus class="shadow-md rounded-full" />
      </div>
    </template>

    <div class="rates p-4 space-y-4 mt-4">
      <RowsRates
        :symbols="symbols"
        :rounded-rates="rates"
        :class="[cssRows.rowSm, cssRows.rowSmDimmed]"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.rates {
  border: 1px solid vars.$gray5;
  border-radius: 8px;
}
</style>

<style lang="scss" module>
@use '@/styles/vars';

.balance {
  color: vars.$gray2;
  font-size: 12px;
  font-weight: 400;
}
</style>
