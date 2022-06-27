<script lang="ts">
import { mapActions, mapState } from 'pinia'

export default {
  name: 'LiquidityModuleAdd',
  data() {
    return {
      isOpen: false,
    }
  },
  computed: {
    ...mapState(useTokensStore, ['selectedTokens']),
    ...mapState(useLiquidityStore, ['pairs']),
    isValid() {
      return (
        this.selectedTokens?.tokenA?.value && this.selectedTokens?.tokenB?.value
      )
    },
  },
  beforeUnmount() {
    this.clearSelectedTokens()
  },
  methods: {
    ...mapActions(useTokensStore, ['clearSelectedTokens']),
    getFormattedRate(v1, v2) {
      const bigNA = $kaikas.bigNumber(v1)
      const bigNB = $kaikas.bigNumber(v2)

      return bigNA.dividedBy(bigNB).toFixed(5)
    },
    getFormattedPercent(v1, v2) {
      const bigNA = $kaikas.bigNumber(v1)
      const bigNB = $kaikas.bigNumber(v2)
      const percent = bigNA.dividedToIntegerBy(100)

      return `${bigNB.dividedBy(percent).toFixed(2)}%`
    },
  },
}
</script>

<template>
  <div class="liquidity">
    <LiquidityModuleAddExchangeRate />

    <div class="liquidity--slippage">
      <KlaySlippage />
    </div>

    <KlayButton type="button" :disabled="!isValid" class="liquidity--btn" @click="isOpen = true">
      Supply
    </KlayButton>

    <LiquidityModuleAddModal v-if="isOpen" @close="isOpen = false" />

    <div v-if="isValid" class="liquidity--details">
      <h3>Prices and pool share</h3>

      <div class="liquidity--details--row">
        <span>
          {{ selectedTokens.tokenA.symbol }} per
          {{ selectedTokens.tokenB.symbol }}
        </span>
        <span>
          {{ getFormattedRate(selectedTokens.tokenA.value, selectedTokens.tokenB.value) }}
        </span>
      </div>
      <div class="liquidity--details--row">
        <span>
          {{ selectedTokens.tokenB.symbol }} per
          {{ selectedTokens.tokenA.symbol }}
        </span>
        <span>
          {{ getFormattedRate(selectedTokens.tokenB.value, selectedTokens.tokenA.value) }}
        </span>
      </div>
      <div v-if="selectedTokens.pairBalance" class="liquidity--details--row">
        <span>Share of pool</span>
        <span>{{ getFormattedPercent(selectedTokens.pairBalance, selectedTokens.userBalance) }}</span>
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
