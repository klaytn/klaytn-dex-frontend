<template>
  <div>
    <div class="liquidity--input">
      <TokenInputNew
        :isLoading="exchangeLoading === 'tokenA'"
        @input="(v) => onInput(v, 'tokenA')"
        tokenType="tokenA"
        :isDisabled="isNotValid"
      />
    </div>

    <div class="liquidity--icon">
      <Icon name="plus" />
    </div>
    <div class="liquidity--input">
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
import utils from "@/plugins/utils";

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
      return !this.selectedTokens["tokenA"] || !this.selectedTokens["tokenB"];
    },
  },
  methods: {
    ...mapMutations({
      setSelectedToken: "tokens/SET_SELECTED_TOKEN",
      setComputedToken: "tokens/SET_COMPUTED_TOKEN",
    }),
    ...mapActions({
      quoteForKlay: "liquidity/quoteForKlay",
      quoteForTokenA: "liquidity/quoteForTokenA",
      quoteForTokenB: "liquidity/quoteForTokenB",
    }),
    onInput: debounce(async function (_v, tokenType) {
      if (!_v || this.isNotValid) {
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

        await this.quoteForTokenB(value);
        // this.setExchangeRateIntervalID(
        //   setInterval(() => this.getAmountOut(value), 5000)
        // );
      }

      if (tokenType === "tokenB") {
        this.exchangeLoading = "tokenA";

        await this.quoteForTokenA(value);
        // this.setExchangeRateIntervalID(
        //   setInterval(() => this.getAmountIn(value), 5000)
        // );
      }

      this.exchangeLoading = null;
    }, 500),
  },
};
</script>

<style lang="scss" scoped src="./index.scss" />
