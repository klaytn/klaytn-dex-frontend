<template>
  <div class="rl-amount">
    <div class="rl-amount--wrap-slide">
      <div class="rl-amount--title">{{ value }}%</div>
      <div class="rl-amount--slide">
        <Slide :propsValue="value" @onmove="onMove" />
      </div>
      <div class="rl-amount--tags">
        <button @click="value = 10" type="button" class="rl-amount--tag">
          10%
        </button>
        <button @click="value = 25" type="button" class="rl-amount--tag">
          25%
        </button>
        <button @click="value = 50" type="button" class="rl-amount--tag">
          50%
        </button>
        <button @click="value = 75" type="button" class="rl-amount--tag">
          75%
        </button>
        <button @click="value = 100" type="button" class="rl-amount--tag">
          max
        </button>
      </div>
    </div>

    <div class="rl-amount--receive">
      <div class="title">You will receive</div>

      <div v-if="removeLiquidityPair.amount0" class="rl-amount--row">
        <div>{{ selectedTokens.tokenA.symbol }}</div>
        <div>{{ getFormattedValue(removeLiquidityPair.amount0) }}</div>
      </div>

      <div v-if="removeLiquidityPair.amount1" class="rl-amount--row">
        <div>{{ selectedTokens.tokenB.symbol }}</div>
        <div>{{ getFormattedValue(removeLiquidityPair.amount1) }}</div>
      </div>

      <div class="rl-amount--row">
        <div>
          {{selectedTokens.tokenA.symbol}}
          per
          {{selectedTokens.tokenB.symbol}}
        </div>
        <div>-</div>
      </div>

      <div class="rl-amount--row">
        <div>
          {{selectedTokens.tokenB.symbol}}
          per
          {{selectedTokens.tokenA.symbol}}
        </div>
        <div>-</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations, mapState } from "vuex";

export default {
  computed: {
    ...mapState("liquidity", ["removeLiquidityPair"]),
    ...mapState("tokens", ["selectedTokens"]),
  },
  data() {
    return {
      value: 9,
    };
  },
  methods: {
    ...mapActions({
      removeLiquidity: "liquidity/removeLiquidity",
      calcRemoveLiquidityAmounts: "liquidity/calcRemoveLiquidityAmounts",
    }),
    ...mapMutations({
      setLpValue: "liquidity/SET_RM_LIQ_VALUE",
    }),
    onMove(v) {
      this.value = v;
      const bnValue = this.$kaikas.utils.bigNumber(
        this.selectedTokens.userBalance
      );

      const value = bnValue.dividedBy(100).multipliedBy(v).toFixed(0)
      const renderValue = this.$kaikas.utils.bigNumber(this.$kaikas.utils.fromWei(value))

      this.setLpValue(renderValue.toFixed(5));
      this.calcRemoveLiquidityAmounts(renderValue.toFixed(5));
    },
    getFormattedValue(_v) {
      if (!_v) {
        return "-";
      }
      const bn = new this.$kaikas.bigNumber(this.$kaikas.fromWei(_v));

      return Number(bn.toFixed(4));
    },
  },
};
</script>

<style lang="scss" scoped src="./index.scss" />
