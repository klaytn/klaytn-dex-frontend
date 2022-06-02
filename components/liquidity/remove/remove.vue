<template>
  <div class="rl--wrap">
    <div class="switch">
      <div
        @click="active = 'amount'"
        class="switch--item"
        :class="{ 'switch--item-active': active === 'amount' }"
      >
        Amount
      </div>
      <div
        @click="active = 'detailed'"
        class="switch--item"
        :class="{ 'switch--item-active': active === 'detailed' }"
      >
        Detailed
      </div>
    </div>

    <LiquidityRemoveAmount v-if="active === 'amount'" />
    <LiquidityRemoveDetailed v-if="active === 'detailed'" />

    <Button @click="removeLiquidity" type="button" class="mt">Remove</Button>

    <div class="mt">
      <Collapse>
        <template #head>
          <div class="rl--collapse-label">LP tokens details</div>
        </template>
        <template #main>
          <div
            class="rl--row"
            v-if="selectedTokens.tokenA && selectedTokens.tokenB"
          >
            <div>{{ selectedTokens.tokenA.symbol }}</div>
            <div>
              {{
                removeLiquidityPair.amount0 &&
                getFormattedValue(removeLiquidityPair.amount0)
              }}
            </div>
          </div>
          <div class="rl--row">
            <div>{{ selectedTokens.tokenB.symbol }}</div>
            <div>
              {{
                removeLiquidityPair.amount1 &&
                getFormattedValue(removeLiquidityPair.amount1)
              }}
            </div>
          </div>
          <div
            class="rl--row"
            v-if="selectedTokens.tokenA && selectedTokens.tokenB"
          >
            <div>
              {{ selectedTokens.tokenA.symbol }} per
              {{ selectedTokens.tokenB.symbol }}
            </div>
            <div>-</div>
          </div>
          <div class="rl--row">
            <div>
              {{ selectedTokens.tokenB.symbol }} per
              {{ selectedTokens.tokenA.symbol }}
            </div>
            <div>-</div>
          </div>
        </template>
      </Collapse>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  data() {
    return {
      active: "amount",
    };
  },
  computed: {
    ...mapState("tokens", ["selectedTokens"]),
    ...mapState("liquidity", ["removeLiquidityPair"]),
  },
  methods: {
    ...mapActions({
      removeLiquidity: "liquidity/removeLiquidity",
    }),
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
