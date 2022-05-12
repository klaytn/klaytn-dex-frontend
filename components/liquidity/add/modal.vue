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

        <div class="liquidity--details">
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
  },
};
</script>

<style lang="scss" scoped src="./index.scss"></style>
