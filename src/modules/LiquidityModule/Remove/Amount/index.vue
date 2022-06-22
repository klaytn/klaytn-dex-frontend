<script>
import { mapActions, mapState } from 'pinia'

export default {
  name: 'LiquidityModuleRemoveAmount',
  data() {
    return {
      value: 9,
    }
  },
  computed: {
    ...mapState(useLiquidityStore, ['removeLiquidityPair']),
    ...mapState(useTokensStore, ['selectedTokens']),
  },
  methods: {
    ...mapActions(useLiquidityStore, ['removeLiquidity', 'calcRemoveLiquidityAmounts', 'setRmLiqValue']),
    onMove(v) {
      this.value = v
      const bnValue = $kaikas.utils.bigNumber(
        this.selectedTokens.userBalance,
      )

      const value = bnValue.dividedBy(100).multipliedBy(v).toFixed(0)
      const renderValue = $kaikas.utils.bigNumber($kaikas.utils.fromWei(value))

      this.setRmLiqValue(renderValue.toFixed(5))
      this.calcRemoveLiquidityAmounts(renderValue.toFixed(5))
    },
    getFormattedValue(_v) {
      if (!_v)
        return '-'

      const bn = $kaikas.bigNumber($kaikas.fromWei(_v))

      return Number(bn.toFixed(4))
    },
  },
}
</script>

<template>
  <div class="rl-amount">
    <div class="rl-amount--wrap-slide">
      <div class="rl-amount--title">
        {{ value }}%
      </div>
      <div class="rl-amount--slide">
        <KlaySlider :props-value="value" @move="onMove" />
      </div>
      <div class="rl-amount--tags">
        <button type="button" class="rl-amount--tag" @click="value = 10">
          10%
        </button>
        <button type="button" class="rl-amount--tag" @click="value = 25">
          25%
        </button>
        <button type="button" class="rl-amount--tag" @click="value = 50">
          50%
        </button>
        <button type="button" class="rl-amount--tag" @click="value = 75">
          75%
        </button>
        <button type="button" class="rl-amount--tag" @click="value = 100">
          max
        </button>
      </div>
    </div>

    <div class="rl-amount--receive">
      <div class="title">
        You will receive
      </div>

      <div v-if="removeLiquidityPair.amount0" class="rl-amount--row">
        <div>{{ selectedTokens.tokenA.symbol }}</div>
        <div>{{ getFormattedValue(removeLiquidityPair.amount0) }}</div>
      </div>

      <div v-if="removeLiquidityPair.amount1" class="rl-amount--row">
        <div>{{ selectedTokens.tokenB.symbol }}</div>
        <div>{{ getFormattedValue(removeLiquidityPair.amount1) }}</div>
      </div>

      <div class="rl-amount--row">
        <div>
          {{ selectedTokens.tokenA.symbol }}
          per
          {{ selectedTokens.tokenB.symbol }}
        </div>
        <div>-</div>
      </div>

      <div class="rl-amount--row">
        <div>
          {{ selectedTokens.tokenB.symbol }}
          per
          {{ selectedTokens.tokenA.symbol }}
        </div>
        <div>-</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./index.scss" />
