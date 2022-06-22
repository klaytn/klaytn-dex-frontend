<script>
import debounce from 'debounce'
import { mapActions, mapState } from 'pinia'

export default {
  name: 'LiquidityModuleRemoveDetailed',
  data() {
    return {
      lpTokenValue: null,
    }
  },
  computed: {
    ...mapState(useTokensStore, ['selectedTokens']),
    ...mapState(useLiquidityStore, ['removeLiquidityPair']),
  },
  beforeMount() {
    this.lpTokenValue = this.removeLiquidityPair.lpTokenValue
  },
  methods: {
    ...mapActions(useLiquidityStore, ['setRmLiqValue', 'calcRemoveLiquidityAmounts']),
    setMax() {
      const v = this.getFormattedValue(this.selectedTokens.userBalance)
      this.onInput(v.toString())
      this.lpTokenValue = v
    },
    onInput: debounce(async function (_v) {
      this.setRmLiqValue(_v)
      this.calcRemoveLiquidityAmounts(_v)
    }, 500),
    getFormattedRate(v1, v2) {
      const bigNA = $kaikas.bigNumber(v1)
      const bigNB = $kaikas.bigNumber(v2)

      return bigNA.dividedBy(bigNB).toFixed(5)
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
  <div class="detailed">
    <div class="detailed--input input-amount mt">
      <div class="input-amount--col">
        <input
          v-model="lpTokenValue"
          placeholder="0.345"
          type="number"
          class="input-amount--value"
          @input="onInput($event.target.value)"
        >
        <div class="input-amount--price">
          $284.22
        </div>
      </div>

      <div class="input-amount--col">
        <div class="input-amount--row">
          <button type="button" class="input-amount--max" @click="setMax">
            max
          </button>
          <!--          <img src="" alt=""> -->
          <!--          <img src="" alt=""> -->
          <span class="input-amount--tokens">
            {{ selectedTokens.tokenA.symbol }}-{{
              selectedTokens.tokenB.symbol
            }}
          </span>
        </div>
        <div class="input-amount--price">
          -
        </div>
      </div>
    </div>

    <div class="detailed--icon">
      <KlayIcon name="arrow-down" />
    </div>

    <div class="detailed--input input-amount">
      <div class="input-amount--col">
        <div type="text" class="input-amount--value">
          {{ getFormattedValue(removeLiquidityPair.amount0) }}
        </div>
        <div class="input-amount--price">
          $284.22
        </div>
      </div>

      <div class="input-amount--col">
        <div class="input-amount--row">
          <span class="input-amount--tokens">
            {{ selectedTokens.tokenA.symbol }}
          </span>
        </div>
      </div>
    </div>

    <div class="detailed--icon">
      <KlayIcon name="plus" />
    </div>

    <div class="detailed--input input-amount">
      <div class="input-amount--col">
        <div type="text" class="input-amount--value">
          {{ getFormattedValue(removeLiquidityPair.amount1) }}
        </div>
        <div class="input-amount--price">
          $284.22
        </div>
      </div>
      <div class="input-amount--col">
        <div class="input-amount--row">
          <span class="input-amount--tokens">
            {{ selectedTokens.tokenB.symbol }}
          </span>
        </div>
      </div>
    </div>

    <div class="detailed--details">
      <div class="detailed--details--row">
        <div>
          {{ selectedTokens.tokenA.symbol }} per
          {{ selectedTokens.tokenB.symbol }}
        </div>
        <div>
          {{
            getFormattedRate(
              selectedTokens.tokenA.value,
              selectedTokens.tokenB.value,
            )
          }}
          {{ selectedTokens.tokenA.symbol }}
        </div>
      </div>
      <div class="detailed--details--row">
        <div>
          {{ selectedTokens.tokenB.symbol }} per
          {{ selectedTokens.tokenA.symbol }}
        </div>
        <div>
          {{
            getFormattedRate(
              selectedTokens.tokenB.value,
              selectedTokens.tokenA.value,
            )
          }}
          {{ selectedTokens.tokenB.symbol }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="./index.scss" scoped />
