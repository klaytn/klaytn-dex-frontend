<template>
  <div class="details--wrap" v-if="isValid">
    <Collapse>
      <template #head>
        <h3 class="details--title">Transaction Details</h3>
      </template>
      <template #main>
        <div class="details" v-if="isValid">
          <div class="details--row">
        <span>
          {{ selectedTokens.tokenA.symbol }} per
          {{ selectedTokens.tokenB.symbol }}
        </span>
            <span>
          {{ getFormattedRate(selectedTokens.tokenA.value, selectedTokens.tokenB.value) }}
        </span>
          </div>
          <div class="details--row">
        <span>
          {{ selectedTokens.tokenB.symbol }} per
          {{ selectedTokens.tokenA.symbol }}
        </span>
            <span>
          {{ getFormattedRate(selectedTokens.tokenB.value, selectedTokens.tokenA.value) }}
        </span>
          </div>
          <div v-if="selectedTokens.pairBalance" class="details--row">
            <span>Share of pool</span>
            <span>{{getFormattedPercent(selectedTokens.pairBalance, selectedTokens.userBalance)}}</span>
          </div>
                    <div class="details--row">
                      <span>Route</span>
                      <span>{{ getRoute }}</span>
                    </div>

          <!--          <div class="liquidity&#45;&#45;details&#45;&#45;row">-->
          <!--            <span>Transaction Fee</span>-->
          <!--            <span>0.074 KLAY ($0.013)</span>-->
          <!--          </div>-->
        </div>
      </template>
    </Collapse>
  </div>
</template>

<script>
import {mapState} from "vuex";

export default {
  computed: {
    ...mapState("tokens", ["selectedTokens"]),
    getRoute(){
      return `${this.selectedTokens.tokenA.symbol} > ${this.selectedTokens.tokenB.symbol}`
    },
    isValid() {
      return (
        this.selectedTokens?.tokenA?.value && this.selectedTokens?.tokenB?.value
      );
    },
  },
  methods: {
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

<style scoped lang="scss" src="./details.scss"></style>
