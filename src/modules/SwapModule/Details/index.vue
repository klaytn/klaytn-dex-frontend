<script setup lang="ts" name="SwapModuleDetails">
import { toRefs } from '@vueuse/core'
import { formatRate, formatPercent } from '@/utils/common'

const tokensStore = useTokensStore()
const { tokenA, tokenB, userBalance, pairBalance } = $(toRefs(toRef(tokensStore, 'selectedTokens')))

const getRoute = computed(() => {
  return tokenA && tokenB ? `${tokenA.symbol} > ${tokenB.symbol}` : ''
})
</script>

<template>
  <div
    v-if="tokenA?.value && tokenB?.value"
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
          v-if="pairBalance && userBalance"
          class="details"
        >
          <div class="details--row">
            <span>
              {{ tokenA.symbol }} per
              {{ tokenB.symbol }}
            </span>
            <span>
              {{ formatRate(tokenA.value, tokenB.value) }}
            </span>
          </div>
          <div class="details--row">
            <span>
              {{ tokenB.symbol }} per
              {{ tokenA.symbol }}
            </span>
            <span>
              {{ formatRate(tokenB.value, tokenA.value) }}
            </span>
          </div>
          <div
            v-if="pairBalance"
            class="details--row"
          >
            <span>Share of pool</span>
            <span>{{ formatPercent(pairBalance, userBalance) }}</span>
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
