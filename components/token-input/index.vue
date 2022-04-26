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
          >Balance: {{ selected.balance }}</TextField
        >
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
    ...mapState("swap", ["selectedTokens", "exchangeRateLoading"]),
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
  methods: {
    ...mapMutations({
      setSelectedToken: "swap/SET_SELECTED_TOKEN",
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

      this.setSelectedToken({
        token: {
          ...this.selected,
          value: value,
        },
        type: this.tokenType,
      })

      if (this.tokenType === "tokenA") {
        this.getAmountOut(value)
      }

      if (this.tokenType === "tokenB") {
        this.getAmountIn(value)
      }
    }, 500),
  },
}
</script>

<style scoped lang="scss">
.token {
  &-loading {
    opacity: 0.4;
  }
  &-input {
    background: $gray3;
    padding: 16px 16px;
    border-radius: 8px;
  }

  &-value {
    display: flex;
    align-items: center;

    & input {
      font-style: normal;
      font-weight: 600;
      font-size: 30px;
      line-height: 130%;
      color: $dark2;
      background: transparent;
      border: none;
      max-width: 212px;
      width: 100%;
    }

    & button {
      font-weight: 700;
      font-size: 10px;
      line-height: 16px;
      background: $blue;
      border-radius: 8px;
      color: $white;
      padding: 4px 8px;
      margin-left: 8px;
      cursor: pointer;
    }
  }

  &-meta {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;

    & .price {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 15px;
      color: $gray4;
      margin-right: 6px;
      max-width: 200px;
    }

    & .row {
      display: flex;
      align-items: center;
      height: 25px;

      &:hover {
        cursor: pointer;

        & .token-info {
          display: block !important;
        }
      }
    }
  }

  &-info {
    display: none;
    background: $white;
    position: absolute;
    top: 20px;
    right: -80px;
    width: 176px;
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    padding: 16px;
    box-sizing: border-box;
    z-index: 9;
    text-align: left;

    &:after {
      display: block;
      content: "";
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 10px solid $white;
      top: -9px;
      left: calc(50% - 6px);
      position: absolute;
    }

    & p {
      font-style: normal;
      font-weight: 700;
      font-size: 13px;
      line-height: 16px;
      margin-bottom: 8px;
    }

    & .price {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 15px;
      max-width: 100px;
    }

    & .percent {
      color: $green;
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 15px;
    }

    & .link {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 180%;
      display: flex;
      align-items: center;
      color: $dark2;
      margin-top: 8px;
      padding-bottom: 5px;
      border-bottom: 1px solid $gray5;

      & .svg-icon {
        height: 15px;
      }

      & span {
        margin-right: 5px;
        font-style: normal;
        font-weight: 500;
        font-size: 12px;
        line-height: 180%;

        &:hover {
          color: $blue;
        }
      }
    }

    & .address {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 180%;
      display: flex;
      align-items: center;
      color: $dark2;
      margin-top: 4px;
      cursor: pointer;

      & .svg-icon {
        height: 15px;
      }

      & span {
        margin-right: 5px;
        font-style: normal;
        font-weight: 500;
        font-size: 12px;
        line-height: 180%;

        &:hover {
          color: $blue;
        }
      }
    }
  }
}
</style>
