<script lang="ts">
import debounce from 'debounce'
import { mapActions, mapState } from 'pinia'

export default {
  name: 'LiquidityModuleAddExchangeRate',
  data() {
    return {
      exchangeLoading: null,
    }
  },
  computed: {
    ...mapState(useTokensStore, ['selectedTokens']),
    isNotValid() {
      return !this.selectedTokens.tokenA || !this.selectedTokens.tokenB
    },
  },
  methods: {
    ...mapActions(useTokensStore, ['Token', 'setComputedToken', 'setSelectedToken']),
    ...mapActions(useLiquidityStore, ['quoteForTokenA', 'quoteForTokenB']),
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

      if (this.selectedTokens.emptyPair)
        return

      this.setComputedToken(tokenType === 'tokenA' ? 'tokenB' : 'tokenA')

      if (tokenType === 'tokenA') {
        this.exchangeLoading = 'tokenB'

        await this.quoteForTokenB(value)
        // this.setExchangeRateIntervalID(
        //   setInterval(() => this.getAmountOut(value), 5000)
        // );
      }

      if (tokenType === 'tokenB') {
        this.exchangeLoading = 'tokenA'

        await this.quoteForTokenA(value)
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
    <div class="liquidity--input">
      <TokenInput
        :is-loading="exchangeLoading === 'tokenA'"
        token-type="tokenA"
        :is-disabled="isNotValid"
        @input="(v) => onInput(v, 'tokenA')"
      />
    </div>

    <div class="liquidity--icon">
      <KlayIcon name="plus" />
    </div>

    <div class="liquidity--input">
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
