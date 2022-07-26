<script setup lang="ts">
import { buildPair, TOKEN_TYPES } from '@/utils/pair'
import { storeToRefs } from 'pinia'
import { tokenWeiToRaw } from '@/core/kaikas'
import { LP_TOKEN_DECIMALS } from '@/core/kaikas/const'
import { roundTo } from 'round-to'
import cssRows from '../../ModuleTradeShared/rows.module.scss'

const store = useLiquidityRmStore()
const {
  selectedTokensData,
  pairReserves,
  pairUserBalance,
  selectedTokensSymbols: symbols,
  formattedPoolShare,
} = storeToRefs(store)

const formattedReserves = computed(() => {
  const reserves = unref(pairReserves)
  const tokensData = unref(selectedTokensData)
  if (!reserves || !tokensData) return null
  return buildPair((type) => {
    const wei = reserves[type === 'tokenA' ? 'reserve0' : 'reserve1']
    const data = tokensData[type]!
    const value = tokenWeiToRaw(data, wei)
    return roundTo(Number(value), 7)
  })
})

const formattedPoolTokens = computed(() => {
  const wei = unref(pairUserBalance)
  if (!wei) return null
  const value = tokenWeiToRaw({ decimals: LP_TOKEN_DECIMALS }, wei)
  return roundTo(Number(value), 7)
})
</script>

<template>
  <KlayCollapse v-if="symbols">
    <template #head>
      <h3 class="py-2">
        LP tokens details
      </h3>
    </template>
    <template #main>
      <div class="space-y-4 pb-2 pt-4">
        <div
          v-for="token in TOKEN_TYPES"
          :key="token"
          :class="cssRows.rowMd"
        >
          <span>Pooled {{ symbols[token] }}</span>
          <span>
            <template v-if="formattedReserves">
              {{ formattedReserves[token] }}
            </template>
            <template v-else> &mdash; </template>
          </span>
        </div>

        <div :class="cssRows.rowMd">
          <span>Your pool tokens:</span>
          <span>
            <template v-if="formattedPoolTokens">{{ formattedPoolTokens }}</template>
            <template v-else> &mdash; </template>
          </span>
        </div>

        <div :class="cssRows.rowMd">
          <span>Your pool share:</span>
          <span>
            <template v-if="formattedPoolShare">{{ formattedPoolShare }}</template>
            <template v-else> &mdash; </template>
          </span>
        </div>
      </div>
    </template>
  </KlayCollapse>
</template>

<style lang="scss" scoped>
h3 {
  font-size: 14px;
}
</style>
