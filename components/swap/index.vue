<template>
  <div v-if="isLoading" class="wrap">
    <div class="head">
      <button class="head--btn head--btn-active">Swap</button>
      <button class="head--btn">Liquidity</button>
      <button class="head--btn head--btn-left" @click="onRefresh">
        <Icon name="refresh" />
      </button>
      <button class="head--btn">
        <Icon name="filters" />
      </button>
    </div>
    <div class="load">
      <Loader />
    </div>
  </div>

  <Wrap v-else>
    <TokenInput token-type="tokenA" />

    <button class="change-btn">
      <Icon name="arrow-down" />
    </button>

    <div class="margin-block">
      <TokenInput token-type="tokenB" />
    </div>

    <div class="slippage">
      <Slippage />
    </div>

    <Button :disabled="!isValidTokens" @click="swapTokens">{{
        isSwapLoading ? "Wait" : "Swap"
      }}</Button>
    <br />
    <!--    <Button :disabled="!isValidTokens" @click="AddLQ">ADDLQ</Button>-->

    <br />

    <div v-if="exchangeRateLoading">Exchange rate loading</div>

    <div v-if="pairNotExist">Pair doesn't exist</div>
  </Wrap>
</template>

<script>
import { mapActions, mapMutations, mapState } from "vuex";

export default {
  name: "KlaySwap",
  data() {
    return {
      isSwapLoading: false,
    };
  },
  computed: {
    ...mapState("swap", [
      "selectedTokens",
      "tokensList",
      "exchangeRateLoading",
      "pairNotExist",
      "computedToken",
      "exchangeRateIntervalID",
    ]),
    isLoading() {
      return !this.tokensList?.length;
    },
    isValidTokens() {
      return (
        !this.isSwapLoading &&
        !this.pairNotExist &&
        Number(this.selectedTokens.tokenA?.balance) > 0 &&
        Number(this.selectedTokens.tokenB?.balance) > 0
      );
    },
  },
  beforeMount() {
    if(!this.tokensList?.length) {
      this.getTokens();
    }
  },
  methods: {
    ...mapActions({
      getTokens: "swap/getTokens",
      AddLQ: "swap/AddLQ",
      swapExactTokensForTokens: "swap/swapExactTokensForTokens",
      swapTokensForExactTokens: "swap/swapTokensForExactTokens",
    }),
    ...mapMutations({
      refreshStore: "swap/REFRESH_STORE",
      setExchangeRateIntervalID: "swap/SET_EXCHANGE_RATE_INTERVAL_ID",
    }),
    async swapTokens() {
      try {
        this.isSwapLoading = true;

        if (this.computedToken === "tokenB") {
          await this.swapExactTokensForTokens();
        }
        if (this.computedToken === "tokenA") {
          await this.swapTokensForExactTokens();
        }
        if (this.exchangeRateIntervalID) {
          clearInterval(this.exchangeRateIntervalID);
          this.setExchangeRateIntervalID(null);
        }
      } catch (e) {}
      this.isSwapLoading = false;
    },
    onRefresh() {
      this.refreshStore();
    },
  },
};
</script>

<style lang="scss" scoped src="./index.scss" />
