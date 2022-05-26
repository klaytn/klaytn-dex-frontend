<template>
  <div>
    <TokenInputNew
      :isLoading="exchangeLoading === 'tokenA'"
      @input="(v) => onInput(v, 'tokenA')"
      tokenType="tokenA"
      :isDisabled="isNotValid"
    />
    <button class="change-btn">
      <Icon name="arrow-down" />
    </button>
    <div class="margin-block">
      <TokenInputNew
        :isLoading="exchangeLoading === 'tokenB'"
        @input="(v) => onInput(v, 'tokenB')"
        tokenType="tokenB"
        :isDisabled="isNotValid"
      />
    </div>

    <div class="warning-text" v-if="selectedTokens.emptyPair">
      <Icon name="important" />
      <span>Pair not exist</span>
    </div>
  </div>
</template>

<script>
import debounce from "debounce";
import { mapActions, mapMutations, mapState } from "vuex";

export default {
  name: "SwapExchangeRate",
  data() {
    return {
      exchangeLoading: null,
    };
  },
  computed: {
    ...mapState("tokens", ["selectedTokens"]),
    isNotValid() {
      return (
        !this.selectedTokens["tokenA"] ||
        !this.selectedTokens["tokenB"] ||
        this.selectedTokens.emptyPair
      );
    },
  },
  methods: {
    ...mapMutations({
      setSelectedToken: "tokens/SET_SELECTED_TOKEN",
      setComputedToken: "tokens/SET_COMPUTED_TOKEN",
    }),
    ...mapActions({
      getAmountOut: "swap/getAmountOut",
      getAmountIn: "swap/getAmountIn",
    }),
    onInput: debounce(async function (_v, tokenType) {
      if (!_v || this.sNotValid) {
        return;
      }

      // if (this.exchangeRateIntervalID) {
      //   clearInterval(this.exchangeRateIntervalID);
      //   this.setExchangeRateIntervalID(null);
      // }

      const value = this.$kaikas.toWei(_v);

      this.setSelectedToken({
        token: {
          ...this.selectedTokens[tokenType],
          value,
        },
        type: tokenType,
      });

      this.setComputedToken(tokenType === "tokenA" ? "tokenB" : "tokenA");

      if (tokenType === "tokenA") {
        this.exchangeLoading = "tokenB";

        await this.getAmountOut(value);
        // this.setExchangeRateIntervalID(
        //   setInterval(() => this.getAmountOut(value), 5000)
        // );
      }

      if (tokenType === "tokenB") {
        this.exchangeLoading = "tokenA";

        await this.getAmountIn(value);
        // this.setExchangeRateIntervalID(
        //   setInterval(() => this.getAmountIn(value), 5000)
        // );
      }

      this.exchangeLoading = null;
    }, 500),
  },
};
</script>

<style lang="scss" scoped src="../index.scss" />
