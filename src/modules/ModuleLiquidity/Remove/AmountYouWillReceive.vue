<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { buildPair, TokenType } from '@/utils/pair'
import { roundTo } from 'round-to'
import { tokenWeiToRaw, asWei, ValueWei } from '@/core/kaikas'
import { computeRates, roundRates } from '@/utils/common'
import BigNumber from 'bignumber.js'

const store = useLiquidityRmStore()
const { amounts, selectedTokensData: tokens } = storeToRefs(store)
const symbols = reactive(buildPair((type) => computed(() => tokens.value[type]?.symbol)))

// function formatAmount(wei: string | null | undefined, token: TokenType): string | number {
//   const data = tokens.value[token]
//   if (!data || !wei) return '-'
//   return roundTo(Number(tokenWeiToRaw(data, asWei(wei))), 7)
//   // return
// }

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
  <div
    v-if="symbols.tokenA && symbols.tokenB"
    class="space-y-4"
  >
    <h4 class="flex items-center space-x-2">
      <span> You will receive </span>
      <IconKlayImportant />
    </h4>

    <div class="row">
      <div>{{ symbols.tokenA }}</div>
      <div>{{ formattedAmounts?.tokenA ?? '-' }}</div>
    </div>

    <div class="row">
      <div>{{ symbols.tokenB }}</div>
      <div>{{ formattedAmounts?.tokenB ?? '-' }}</div>
    </div>

    <div class="row">
      <div>
        {{ symbols.tokenA }}
        per
        {{ symbols.tokenB }}
      </div>
      <span>{{ rates?.a_per_b ?? '-' }}</span>
    </div>

    <div class="row">
      <div>
        {{ symbols.tokenB }}
        per
        {{ symbols.tokenA }}
      </div>
      <span>{{ rates?.b_per_a ?? '-' }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
