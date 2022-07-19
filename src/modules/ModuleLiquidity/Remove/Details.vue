<script setup lang="ts">
import { buildPair, TOKEN_TYPES } from '@/utils/pair'
import { storeToRefs } from 'pinia'
import { tokenWeiToRaw } from '@/core/kaikas'
import { LP_TOKEN_DECIMALS } from '@/core/kaikas/const'
import { roundTo } from 'round-to'
import BigNumber from 'bignumber.js'

const store = useLiquidityRmStore()
const { selectedTokensData, pairReserves, pairTotalSupply, pairUserBalance } = storeToRefs(store)

const symbols = reactive(buildPair((type) => computed(() => selectedTokensData.value[type]?.symbol)))

const formattedReserves = computed(() => {
  const reserves = unref(pairReserves)
  const tokensData = unref(selectedTokensData)
  if (!reserves || !tokensData.tokenA || !tokensData.tokenB) return null
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

const formattedPoolShare = computed(() => {
  const total = unref(pairTotalSupply)
  const user = unref(pairUserBalance)
  if (!total || !user) return null
  const num = new BigNumber(user).div(total).toNumber()
  return `${roundTo(num, 2)}%`
})
</script>

<template>
  <KlayCollapse>
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
          class="row"
        >
          <span>Pooled {{ symbols[token] }}</span>
          <span>
            <template v-if="formattedReserves">
              {{ formattedReserves[token] }}
            </template>
            <template v-else> &mdash; </template>
          </span>
        </div>

        <div class="row">
          <span>Your pool tokens:</span>
          <span>
            <template v-if="formattedPoolTokens">{{ formattedPoolTokens }}</template>
            <template v-else> &mdash; </template>
          </span>
        </div>

        <div class="row">
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

<style lang="scss">
h3 {
  font-size: 14px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 500;

  & > :last-child {
    font-weight: 600;
  }
}
</style>
