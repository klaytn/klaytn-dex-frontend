<template>
  <div
    class="token-input"
    :class="{ 'token-loading': tokenType === exchangeRateLoading }"
  >
    <div class="token-value">
      <input
        :value="value"
        placeholder="0.045"
        @input="input($event.target.value)"
      />
      <button @click="input(selected.balance)">MAX</button>
      <TokenSelect
        v-if="selected"
        :selected-token="selected"
        @select="setToken"
      />
    </div>

    <div class="token-meta">
      <span class="price">{{ price }}</span>
      <div v-if="selected" class="row">
        <TextField :title="selected.balance" class="price"
          >Balance: {{ selected.balance }}
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
import { mapActions, mapMutations, mapState } from "vuex"
import { copyToClipboard } from "~/utils/common"
import { roundTo } from "round-to"
import debounce from "debounce"

export default {
  name: "TokenInput",
  props: {
    tokenType: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapState("swap", [
      "selectedTokens",
      "exchangeRateLoading",
      "exchangeRateIntervalID",
    ]),
    selected() {
      return this.selectedTokens[this.tokenType]
    },
    price() {
      return this.selected?.price?.price
        ? `$${roundTo(this.selected?.price?.price, 5)}`
        : "Price loading"
    },
    value() {
      return this.selected?.value || null
    },
    formattedAddress() {
      return this.$kaikas.getFormattedAddress(this.selected.address)
    },
  },
  beforeDestroy() {
    if (this.exchangeRateIntervalID) {
      clearInterval(this.exchangeRateIntervalID)
    }
  },
  methods: {
    ...mapMutations({
      setSelectedToken: "swap/SET_SELECTED_TOKEN",
      setComputedToken: "swap/SET_COMPUTED_TOKEN",
      setExchangeRateIntervalID: "swap/SET_EXCHANGE_RATE_INTERVAL_ID",
    }),
    ...mapActions({
      setCurrencyRate: "swap/setCurrencyRate",
      getAmountOut: "swap/getAmountOut",
      getAmountIn: "swap/getAmountIn",
    }),
    copyToClipboard,
    setToken(token) {
      this.setCurrencyRate({ id: token.id, type: this.tokenType })
      this.setSelectedToken({ token, type: this.tokenType })
    },
    input: debounce(function (value) {
      const regex = /^\d*\.?\d*$/

      if (!this.selected || !value || !regex.test(value)) {
        return
      }

      if (this.exchangeRateIntervalID) {
        clearInterval(this.exchangeRateIntervalID)
        this.setExchangeRateIntervalID(null)
      }

      this.setSelectedToken({
        token: {
          ...this.selected,
          value: value,
        },
        type: this.tokenType,
      })

      this.setComputedToken(this.tokenType === "tokenA" ? "tokenB" : "tokenA")

      if (this.tokenType === "tokenA") {
        this.getAmountOut(value)
        this.setExchangeRateIntervalID(
          setInterval(() => this.getAmountOut(value), 5000)
        )
      }

      if (this.tokenType === "tokenB") {
        this.getAmountIn(value)
        this.setExchangeRateIntervalID(
          setInterval(() => this.getAmountIn(value), 5000)
        )
      }
    }, 500),
  },
}
</script>

<style scoped lang="scss" src="./index.scss" />
