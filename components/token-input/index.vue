<template>
  <div
    class="token-input"
    :class="{ 'token-loading': tokenType === exchangeRateLoading }"
  >
    <div class="token-value">
      <input
        v-if="selected"
        :value="value"
        placeholder="0"
        type="number"
        @input="input($event.target.value)"
      />
      <button v-if="selected" @click="input(selected.balance)">MAX</button>

      <div class="token-select-wrap">
        <TokenSelect :selected-token="selected" @select="setToken" />
      </div>
    </div>

    <div class="token-meta" v-if="selected">
      <span class="price">{{ price }}</span>
      <div v-if="selected" class="row">
        <TextField :title="selected.balance" class="price">
          Balance: {{ renderBalance }}
        </TextField>

        <Icon name="important"></Icon>

        <div class="token-info">
          <p>{{ selected.name }} {{ `(${selected.symbol})` }}</p>
          <span class="price">{{ price }}</span>
          <span class="percent">0.26%</span>
          <a
            :href="`https://coinmarketcap.com/currencies/${selected.slug}/`"
            class="link"
            target="_blank"
          >
            <span class="link-name">Coinmarketcap</span>
            <Icon name="link" />
          </a>
          <div class="address" @click="copyToClipboard(selected.address)">
            <span class="address-name">{{ formattedAddress }}</span>
            <Icon name="copy" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations, mapState } from "vuex";
import { copyToClipboard } from "~/utils/common";
import { roundTo } from "round-to";
import debounce from "debounce";
import web3 from "web3";

export default {
  name: "TokenInput",
  props: {
    tokenType: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapState("swap", ["exchangeRateIntervalID", "exchangeRateLoading"]),
    ...mapState("tokens", ["selectedTokens"]),
    selected() {
      return this.selectedTokens[this.tokenType];
    },
    renderBalance() {
      return roundTo(Number(web3.utils.fromWei(this.selected.balance)), 5);
    },
    price() {
      return "-";
      // return this.selected?.price?.price
      //   ? `$${roundTo(this.selected?.price?.price, 5)}`
      //   : "Price loading";
    },
    value() {
      if (!this.selected?.value) {
        return null;
      }
      const bn = new this.$kaikas.bigNumber(
        this.$kaikas.fromWei(this.selected.value)
      );
      return Number(bn.toFixed(4));
    },
    formattedAddress() {
      return this.$kaikas.getFormattedAddress(this.selected.address);
    },
  },
  beforeDestroy() {
    if (this.exchangeRateIntervalID) {
      clearInterval(this.exchangeRateIntervalID);
    }
    this.setExchangeLoading(null);
  },
  methods: {
    ...mapMutations({
      setSelectedToken: "tokens/SET_SELECTED_TOKEN",
      setComputedToken: "swap/SET_COMPUTED_TOKEN",
      setExchangeRateIntervalID: "swap/SET_EXCHANGE_RATE_INTERVAL_ID",
      setExchangeLoading: "swap/SET_EXCHANGE_LOADING",
    }),
    ...mapActions({
      setCurrencyRate: "tokens/setCurrencyRate",
      getAmountOut: "swap/getAmountOut",
      getAmountIn: "swap/getAmountIn",
    }),
    copyToClipboard,
    setToken(token) {
      this.setCurrencyRate({ id: token.id, type: this.tokenType });
      this.setSelectedToken({ token, type: this.tokenType });
    },
    input: debounce(async function (v) {
      if (!this.selected || !v) {
        return;
      }

      if (this.exchangeRateIntervalID) {
        clearInterval(this.exchangeRateIntervalID);
        this.setExchangeRateIntervalID(null);
      }

      const value = this.$kaikas.toWei(v);

      this.setSelectedToken({
        token: {
          ...this.selected,
          value,
        },
        type: this.tokenType,
      });

      this.setComputedToken(this.tokenType === "tokenA" ? "tokenB" : "tokenA");

      if (this.tokenType === "tokenA") {
        this.setExchangeLoading("tokenB");

        await this.getAmountOut(value);
        // this.setExchangeRateIntervalID(
        //   setInterval(() => this.getAmountOut(value), 5000)
        // );
      }

      if (this.tokenType === "tokenB") {
        this.setExchangeLoading("tokenA");

        await this.getAmountIn(value);
        // this.setExchangeRateIntervalID(
        //   setInterval(() => this.getAmountIn(value), 5000)
        // );
      }

      this.setExchangeLoading(null);
    }, 500),
  },
};
</script>

<style scoped lang="scss" src="./index.scss" />
