<script setup lang="ts" name="SwapModuleDetails">
import { toRefs } from '@vueuse/core'
import type BigNumber from 'bignumber.js'

const tokensStore = useTokensStore()
const { selectedTokens } = toRefs(tokensStore)
const { tokenA, tokenB, userBalance, pairBalance } = toRefs(selectedTokens)

const getRoute = computed(() => {
  if (tokenA.value === null || tokenB.value === null) return ''

  return `${tokenA.value.symbol} > ${tokenB.value.symbol}`
})
const isValid = computed(() => {
  return tokenA.value && tokenB.value
})

function getFormattedRate(v1: BigNumber.Value, v2: BigNumber.Value) {
  const bigNA = $kaikas.bigNumber(v1)
  const bigNB = $kaikas.bigNumber(v2)

  return bigNA.dividedBy(bigNB).toFixed(5)
}

function getFormattedPercent(v1: BigNumber.Value, v2: BigNumber.Value) {
  const bigNA = $kaikas.bigNumber(v1)
  const bigNB = $kaikas.bigNumber(v2)
  const percent = bigNA.dividedToIntegerBy(100)

  return `${bigNB.dividedBy(percent).toFixed(2)}%`
}
</script>

<template>
  <div
    v-if="isValid"
    class="details--wrap"
  >
    <KlayCollapse>
      <template #head>
        <h3 class="details--title">
          Transaction Details
        </h3>
      </template>
      <template #main>
        <div
          v-if="tokenA && tokenB && pairBalance && userBalance && isValid"
          class="details"
        >
          <div class="details--row">
            <span>
              {{ tokenA.symbol }} per
              {{ tokenB.symbol }}
            </span>
            <span>
              {{ getFormattedRate(tokenA.value, tokenB.value) }}
            </span>
          </div>
          <div class="details--row">
            <span>
              {{ tokenB.symbol }} per
              {{ tokenA.symbol }}
            </span>
            <span>
              {{ getFormattedRate(tokenB.value, tokenA.value) }}
            </span>
          </div>
          <div
            v-if="pairBalance"
            class="details--row"
          >
            <span>Share of pool</span>
            <span>{{ getFormattedPercent(pairBalance, userBalance) }}</span>
          </div>
          <div class="details--row">
            <span>Route</span>
            <span>{{ getRoute }}</span>
          </div>

          <!--          <div class="liquidity&#45;&#45;details&#45;&#45;row"> -->
          <!--            <span>Transaction Fee</span> -->
          <!--            <span>0.074 KLAY ($0.013)</span> -->
          <!--          </div> -->
        </div>
      </template>
    </KlayCollapse>
  </div>
</template>

<style scoped lang="scss" src="./index.scss"></style>
