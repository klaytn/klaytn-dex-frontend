<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { buildPair, TOKEN_TYPES } from '@/utils/pair'
import { roundTo } from 'round-to'
import { tokenWeiToRaw, asWei } from '@/core/kaikas'

const store = useLiquidityRmStore()
const { amounts, selectedTokensData: tokens, selectedTokensSymbols: symbols, rates } = storeToRefs(store)

const formattedAmounts = computed(() => {
  if (!amounts.value || !tokens.value) return null
  return buildPair((type) => {
    const data = tokens.value![type]
    return roundTo(Number(tokenWeiToRaw(data, asWei(amounts.value![type].toString()))), 7)
  })
})
</script>

<template>
  <div v-if="symbols">
    <h4 class="flex items-center space-x-2 mb-4">
      <span> You will receive </span>
      <IconKlayImportant />
    </h4>

    <div class="space-y-3 mb-4">
      <div
        v-for="token in TOKEN_TYPES"
        :key="token"
        class="row flex items-center justify-between"
      >
        <div class="flex items-center space-x-2">
          <KlayCharAvatar :symbol="symbols[token]" />
          <span>
            {{ symbols[token] }}
          </span>
        </div>
        <div>
          <ValueOrDash :value="formattedAmounts?.[token]" />
        </div>
      </div>
    </div>

    <div class="space-y-5">
      <RowsRates
        :symbols="symbols"
        :rounded-rates="rates"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.row {
  font-size: 12px;
  font-weight: 500;
}
</style>
