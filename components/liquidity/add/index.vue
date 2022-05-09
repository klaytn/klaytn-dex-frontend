<template>
  <div class="liquidity">
    <div class="liquidity--input">
      <LiquidityTokenInput tokenType="tokenA" />
    </div>

    <div class="liquidity--icon">
      <Icon name="plus" />
    </div>

    <div class="liquidity--input">
      <LiquidityTokenInput tokenType="tokenB" />
    </div>

    <Button :disabled="!isValid" class="liquidity--btn" @click="isOpen = true">
      Supply
    </Button>

    <LiquidityAddModal v-if="isOpen" @close="isOpen = false" />

    <div class="liquidity--details" v-if="isValid">
      <h3>Prices and pool share</h3>

      <div class="liquidity--details--row">
        <span>ETH per KLAY</span>
        <span>2192.98 </span>
      </div>
      <div class="liquidity--details--row">
        <span>KLAY per ETH</span>
        <span>0.0003423</span>
      </div>
      <div class="liquidity--details--row">
        <span>Share of pool</span>
        <span>0.0069%</span>
      </div>
      <div class="liquidity--details--row">
        <span>You'll earn</span>
        <span>0.17%</span>
      </div>

      <div class="liquidity--details--row">
        <span>Transaction Fee</span>
        <span>0.074 KLAY ($0.013)</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "AddLiquidity",
  data() {
    return {
      isOpen: false,
    };
  },
  computed: {
    ...mapState("tokens", ["selectedTokens"]),
    isValid() {
      return (
        this.selectedTokens?.tokenA?.value && this.selectedTokens?.tokenB?.value
      );
    },
  }
};
</script>

<style lang="scss" scoped src="./index.scss"></style>
