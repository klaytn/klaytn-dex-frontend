<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { TOKEN_TYPES, buildPair } from '@/utils/pair'
import cssRows from '../../ModuleTradeShared/rows.module.scss'
import { KlayIconImportant } from '~klay-icons'

const store = useLiquidityRmStore()
const {
  amounts,
  selectedTokensData: tokens,
  selectedTokensSymbols: symbols,
  rates,
  isAmountsPending,
} = storeToRefs(store)

const amountsAsTokens = computed(() => {
  const amountsVal = amounts.value
  const tokensVal = tokens.value
  if (!amountsVal || !tokensVal) return null
  return buildPair((type) => amountsVal[type].decimals(tokensVal[type]))
})
</script>

<template>
  <div v-if="symbols">
    <h4 class="flex items-center space-x-2 mb-4">
      <span> You will receive </span>
      <KlayIconImportant />

      <KlayLoader
        v-if="isAmountsPending"
        size="16"
      />
    </h4>

    <div class="space-y-3 mb-4">
      <div
        v-for="token in TOKEN_TYPES"
        :key="token"
        class="flex items-center justify-between"
        :class="cssRows.rowSm"
      >
        <div class="flex items-center space-x-2">
          <KlayCharAvatar :symbol="symbols[token]" />
          <span>
            {{ symbols[token] }}
          </span>
        </div>
        <div>
          <CurrencyFormat
            :amount="amountsAsTokens?.[token]"
            :decimals="7"
          />
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <RowsRates
        :symbols="symbols"
        :rounded-rates="rates"
        :class="[cssRows.rowSm, cssRows.rowSmDimmed]"
      />
    </div>
  </div>
</template>
