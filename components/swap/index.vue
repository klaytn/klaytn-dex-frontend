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
    <SwapExchangeRate />

    <div class="slippage">
      <Slippage />
    </div>

    <Button :disabled="!isValidTokens" @click="swapTokens">
      {{ isSwapLoading ? "Wait" : "Swap" }}
    </Button>

    <SwapDetails />

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
      "pairNotExist",
      "exchangeRateIntervalID",
      "exchangeRateLoading",
    ]),
    ...mapState("tokens", ["selectedTokens", "tokensList", "computedToken"]),
    isLoading() {
      return !this.tokensList?.length;
    },
    isValidTokens() {
      return (
        !this.isSwapLoading &&
        !this.selectedTokens.emptyPair &&
        Number(this.selectedTokens.tokenA?.balance) >= 0 &&
        Number(this.selectedTokens.tokenB?.balance) >= 0
      );
    },
  },
  beforeDestroy() {
    this.refreshStore();
    this.clearSelectedTokens();
  },
  methods: {
    ...mapActions({
      swapExactTokensForTokens: "swap/swapExactTokensForTokens",
      swapTokensForExactTokens: "swap/swapTokensForExactTokens",
      swapForKlayTokens: "swap/swapForKlayTokens",
    }),
    ...mapMutations({
      refreshStore: "swap/REFRESH_STORE",
      clearSelectedTokens: "tokens/CLEAR_SELECTED_TOKENS",
      setExchangeRateIntervalID: "swap/SET_EXCHANGE_RATE_INTERVAL_ID",
    }),
    async swapTokens() {
      try {
        this.isSwapLoading = true;
        const isWKLAY =
          this.$kaikas.utils.isNativeToken(this.selectedTokens.tokenA.address) ||
          this.$kaikas.utils.isNativeToken(this.selectedTokens.tokenB.address);

        if(isWKLAY) {
          await this.swapForKlayTokens();
        }

        if (this.computedToken === "tokenB" && !isWKLAY) {
          await this.swapExactTokensForTokens();
        }
        if (this.computedToken === "tokenA" && !isWKLAY) {
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
