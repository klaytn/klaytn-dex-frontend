<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { formatPercent, formatRate } from '@/utils/common'

const tokensStore = useTokensStore()

const { selectedTokens } = $(storeToRefs(tokensStore))

// FIXME liquidity store does not have "pairs"
// const liquidityStore = useLiquidityStore()
// const { pairs } = storeToRefs(liquidityStore)

const isOpen = $ref(false)

const isValid = $computed(() => selectedTokens.tokenA?.value && selectedTokens.tokenB?.value)

onBeforeUnmount(() => {
  tokensStore.clearSelectedTokens()
})
</script>

<template>
  <div class="liquidity">
    <LiquidityModuleAddExchangeRate />

    <div class="liquidity--slippage">
      <KlaySlippage />
    </div>

    <KlayButton
      type="button"
      :disabled="!isValid"
      class="liquidity--btn"
      @click="isOpen = true"
    >
      Supply
    </KlayButton>

    <LiquidityModuleAddModal
      v-if="isOpen"
      @close="isOpen = false"
    />

    <div
      v-if="selectedTokens.tokenA?.value && selectedTokens.tokenB?.value"
      class="liquidity--details"
    >
      <h3>Prices and pool share</h3>

      <div class="liquidity--details--row">
        <span>
          {{ selectedTokens.tokenA.symbol }} per
          {{ selectedTokens.tokenB.symbol }}
        </span>
        <span>
          {{ formatRate(selectedTokens.tokenA.value, selectedTokens.tokenB.value) }}
        </span>
      </div>
      <div class="liquidity--details--row">
        <span>
          {{ selectedTokens.tokenB.symbol }} per
          {{ selectedTokens.tokenA.symbol }}
        </span>
        <span>
          {{ formatRate(selectedTokens.tokenB.value, selectedTokens.tokenA.value) }}
        </span>
      </div>
      <div
        v-if="selectedTokens.pairBalance && selectedTokens.userBalance"
        class="liquidity--details--row"
      >
        <span>Share of pool</span>
        <span>{{ formatPercent(selectedTokens.pairBalance, selectedTokens.userBalance) }}</span>
      </div>
      <!--      <div class="liquidity&#45;&#45;details&#45;&#45;row"> -->
      <!--        <span>You'll earn</span> -->
      <!--        <span>0.17%</span> -->
      <!--      </div> -->

      <!--      <div class="liquidity&#45;&#45;details&#45;&#45;row"> -->
      <!--        <span>Transaction Fee</span> -->
      <!--        <span>0.074 KLAY ($0.013)</span> -->
      <!--      </div> -->
    </div>
  </div>
</template>

<style lang="scss" scoped src="./index.scss"></style>
