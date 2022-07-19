<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { buildPair, mirrorTokenType, TOKEN_TYPES } from '@/utils/pair'
import { roundTo } from 'round-to'
import { tokenWeiToRaw, asWei, ValueWei } from '@/core/kaikas'
import { computeRates, roundRates } from '@/utils/common'
import BigNumber from 'bignumber.js'

const store = useLiquidityRmStore()
const { amounts, selectedTokensData: tokens } = storeToRefs(store)
const symbols = reactive(buildPair((type) => computed(() => tokens.value[type]?.symbol)))

const formattedAmounts = computed(() => {
  if (!amounts.value) return null
  if (!tokens.value.tokenA || !tokens.value.tokenB) return null
  return buildPair((type) => {
    const data = tokens.value[type]!
    return roundTo(Number(tokenWeiToRaw(data, asWei(amounts.value![type].toString()))), 7)
  })
})

const rates = computed(() => {
  const { tokenA, tokenB } = amounts.value || {}
  if (!tokenB || !tokenA) return null

  const rates = computeRates(buildPair((type) => amounts.value![type] as unknown as ValueWei<BigNumber>))
  return roundRates(rates)
})
</script>

<template>
  <div v-if="symbols.tokenA && symbols.tokenB">
    <h4 class="flex items-center space-x-2 mb-4">
      <span> You will receive </span>
      <IconKlayImportant />
    </h4>

    <div class="space-y-3 mb-4">
      <div
        v-for="token in TOKEN_TYPES"
        :key="token"
        class="row"
      >
        <div class="flex items-center space-x-2">
          <KlayCharAvatar :symbol="symbols[token]" />
          <span>
            {{ symbols[token] }}
          </span>
        </div>
        <div>{{ formattedAmounts?.[token] ?? '-' }}</div>
      </div>
    </div>

    <div class="space-y-5">
      <div
        v-for="token in TOKEN_TYPES"
        :key="token"
        class="row row--dim"
      >
        <div>
          {{ symbols[token] }}
          per
          {{ symbols[mirrorTokenType(token)] }}
        </div>
        <span>{{ rates?.[token === 'tokenA' ? 'a_per_b' : 'b_per_a'] ?? '-' }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: $dark2;

  &--dim {
    font-weight: 500;
    color: $gray2;
  }
}
</style>
