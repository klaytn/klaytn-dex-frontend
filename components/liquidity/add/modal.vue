<template>
  <Modal @close="$emit('close')" width="344" label="Confirm Supply">
    <div>
      <div
        v-if="status === 'initial' || status === 'in_progress'"
        class="m-content"
      >
        <p class="m-title">You will receive LP ETH-KLAY Tokens</p>
        <div class="m-head">
          <img :src="selectedTokens.tokenA.logo" alt="" />
          <img :src="selectedTokens.tokenB.logo" alt="" />
          <p>3.6747823</p>
        </div>

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
        <span
        >{{ selectedTokens.tokenB.symbol }} per
          {{ selectedTokens.tokenA.symbol }}</span
        >
            <span>
          {{ getFormattedRate(selectedTokens.tokenB.value, selectedTokens.tokenA.value) }}
        </span>
          </div>
          <div v-if="selectedTokens.pairBalance" class="liquidity--details--row">
            <span>Share of pool</span>
            <span>{{getFormattedPercent(selectedTokens.pairBalance, selectedTokens.userBalance)}}</span>
          </div>
<!--          <div class="liquidity&#45;&#45;details&#45;&#45;row">-->
<!--            <span>You'll earn</span>-->
<!--            <span>0.17%</span>-->
<!--          </div>-->

<!--          <div class="liquidity&#45;&#45;details&#45;&#45;row">-->
<!--            <span>Transaction Fee</span>-->
<!--            <span>0.074 KLAY ($0.013)</span>-->
<!--          </div>-->
        </div>

        <p class="error" v-if="error">Error</p>

        <Button
          :disabled="status === 'in_progress'"
          class="liquidity--btn"
          @click="handleAddLiquidity"
        >
          {{ status === "in_progress" ? "Wait" : "Supply" }}
        </Button>
      </div>
      <div v-else-if="status === 'submitted'" class="m-content">
        <div class="submitted">
          <p>Transaction Submitted</p>
<!--          <a href="#"> View on BscScan </a>-->
        </div>
        <Button @click="$emit('close')"> Close</Button>
      </div>
    </div>
  </Modal>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  data() {
    return {
      status: "initial",
      error: false,
    };
  },
  computed: {
    ...mapState("tokens", ["selectedTokens"]),
    ...mapState("tokens", ["selectedTokens"]),
    isValid() {
      return (
        this.selectedTokens?.tokenA?.value && this.selectedTokens?.tokenB?.value
      );
    },
  },
  methods: {
    ...mapActions({
      addLiquidity: "liquidity/addLiquidity",
    }),
    async handleAddLiquidity() {
      try {
        this.error = false;
        this.status = "in_progress";

        await this.addLiquidity();

        this.status = "submitted";
      } catch (e) {
        this.error = true;
        this.status = "initial";
      }
    },
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
