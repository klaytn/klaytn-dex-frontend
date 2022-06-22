<script>
import debounce from 'debounce'
import { mapActions, mapState } from 'pinia'

export default {
  name: 'SwapModuleExchangeRate',
  data() {
    return {
      exchangeLoading: null,
    }
  },
  computed: {
    ...mapState(useTokensStore, ['selectedTokens']),
    isNotValid() {
      return (
        !this.selectedTokens.tokenA
        || !this.selectedTokens.tokenB
        || this.selectedTokens.emptyPair
      )
    },
  },
  methods: {
    ...mapActions(useTokensStore, [
      'setSelectedToken',
      'setComputedToken',
    ]),
    ...mapActions(useSwapStore, [
      'getAmountOut',
      'getAmountIn',
    ]),
    onInput: debounce(async function (_v, tokenType) {
      if (!_v || this.isNotValid)
        return

      // if (this.exchangeRateIntervalID) {
      //   clearInterval(this.exchangeRateIntervalID);
      //   this.setExchangeRateIntervalID(null);
      // }

      const value = $kaikas.toWei(_v)

      this.setSelectedToken({
        token: {
          ...this.selectedTokens[tokenType],
          value,
        },
        type: tokenType,
      })

      this.setComputedToken(tokenType === 'tokenA' ? 'tokenB' : 'tokenA')

      if (tokenType === 'tokenA') {
        this.exchangeLoading = 'tokenB'
        await this.getAmountOut(value)
        // this.setExchangeRateIntervalID(
        //   setInterval(() => this.getAmountOut(value), 5000)
        // );
      }

      if (tokenType === 'tokenB') {
        this.exchangeLoading = 'tokenA'
        await this.getAmountIn(value)
        // this.setExchangeRateIntervalID(
        //   setInterval(() => this.getAmountIn(value), 5000)
        // );
      }

      this.exchangeLoading = null
    }, 500),
  },
}
</script>

<template>
  <div>
    <TokenInput
      :is-loading="exchangeLoading === 'tokenA'"
      token-type="tokenA"
      :is-disabled="isNotValid"
      @input="(v) => onInput(v, 'tokenA')"
    />
    <button class="change-btn">
      <KlayIcon name="arrow-down" />
    </button>
    <div class="margin-block">
      <TokenInput
        :is-loading="exchangeLoading === 'tokenB'"
        token-type="tokenB"
        :is-disabled="isNotValid"
        @input="(v) => onInput(v, 'tokenB')"
      />
    </div>

    <div v-if="selectedTokens.emptyPair" class="warning-text">
      <KlayIcon name="important" />
      <span>Pair not exist</span>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./index.scss" />
