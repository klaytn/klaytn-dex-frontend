<template>
  <div class="liquidity">
    <div class="liquidity--input">
      <!--      <LiquidityTokenInput tokenType="tokenA" />-->
      <TokenInput tokenType="tokenA"/>
    </div>

    <div class="liquidity--icon">
      <Icon name="plus"/>
    </div>

    <div class="liquidity--input">
      <!--      <LiquidityTokenInput tokenType="tokenB" />-->
      <TokenInput tokenType="tokenB"/>
    </div>

    <div class="liquidity--slippage">
      <Slippage/>
    </div>

    <Button type="button" :disabled="!isValid" class="liquidity--btn" @click="isOpen = true">
      Supply
    </Button>

    <LiquidityAddModal v-if="isOpen" @close="isOpen = false"/>

    <div class="liquidity--details" v-if="isValid">
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
      <!--      <div class="liquidity&#45;&#45;details&#45;&#45;row">-->
      <!--        <span>You'll earn</span>-->
      <!--        <span>0.17%</span>-->
      <!--      </div>-->

      <!--      <div class="liquidity&#45;&#45;details&#45;&#45;row">-->
      <!--        <span>Transaction Fee</span>-->
      <!--        <span>0.074 KLAY ($0.013)</span>-->
      <!--      </div>-->
    </div>
  </div>
</template>

<script>
import {mapMutations, mapState} from "vuex";

export default {
  name: "AddLiquidity",
  data() {
    return {
      isOpen: false,
    };
  },
  beforeDestroy() {
    this.clearSelectedTokens();
  },
  computed: {
    ...mapState("tokens", ["selectedTokens"]),
    ...mapState("liquidity", ["pairs"]),
    isValid() {
      return (
        this.selectedTokens?.tokenA?.value && this.selectedTokens?.tokenB?.value
      );
    },
  },
  methods: {
    ...mapMutations({
      clearSelectedTokens: "tokens/CLEAR_SELECTED_TOKENS",
    }),
    getFormattedRate(v1, v2) {
      const bigNA = this.$kaikas.bigNumber(v1)
      const bigNB = this.$kaikas.bigNumber(v2)

      return bigNA.dividedBy(bigNB).toFixed(5);
    },
    getFormattedPercent(v1, v2) {
      const bigNA = this.$kaikas.bigNumber(v1)
      const bigNB = this.$kaikas.bigNumber(v2)
      const percent = bigNA.dividedToIntegerBy(100);

      return `${bigNB.dividedBy(percent).toFixed(2)}%`;
    }
  },
};
</script>

<style lang="scss" scoped src="./index.scss"></style>
