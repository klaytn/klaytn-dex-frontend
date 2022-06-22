<script>
import { mapActions, mapState } from 'pinia'

export default {
  name: 'LiquidityModuleAddModal',
  emits: ['close'],
  data() {
    return {
      status: 'initial',
      error: false,
    }
  },
  computed: {
    ...mapState(useTokensStore, ['selectedTokens', 'computedToken']),
    isValid() {
      return (
        this.selectedTokens?.tokenA?.value && this.selectedTokens?.tokenB?.value
      )
    },
  },
  methods: {
    ...mapActions(useLiquidityStore, ['addLiquidityAmountIn', 'addLiquidityAmountOut', 'addLiquidityETH']),
    async handleAddLiquidity() {
      try {
        this.error = false
        this.status = 'in_progress'
        const isKlayToken
          = $kaikas.utils.isNativeToken(this.selectedTokens.tokenA.address)
          || $kaikas.utils.isNativeToken(this.selectedTokens.tokenB.address)

        if (isKlayToken) {
          await this.addLiquidityETH()
          this.status = 'submitted'
          return
        }
        if (this.computedToken === 'tokenA') {
          await this.addLiquidityAmountIn()
          this.status = 'submitted'
          return
        }

        if (this.computedToken === 'tokenB') {
          await this.addLiquidityAmountOut()
          this.status = 'submitted'
          return
        }
        this.status = 'submitted'
        $notify({ type: 'success', text: 'Transaction Submitted' })
      }
      catch (e) {
        this.status = 'initial'
        $notify({ type: 'error', text: 'Transaction Reverted' })
      }
    },
    getFormattedRate(v1, v2) {
      const bigNA = $kaikas.bigNumber(v1)
      const bigNB = $kaikas.bigNumber(v2)

      return bigNA.dividedBy(bigNB).toFixed(5)
    },
    getFormattedPercent(v1, v2) {
      const bigNA = $kaikas.bigNumber(v1)
      const bigNB = $kaikas.bigNumber(v2)
      const percent = bigNA.dividedToIntegerBy(100)

      return `${bigNB.dividedBy(percent).toFixed(2)}%`
    },
  },
}
</script>

<template>
  <KlayModal width="344" label="Confirm Supply" @close="$emit('close')">
    <div>
      <div
        v-if="status === 'initial' || status === 'in_progress'"
        class="m-content"
      >
        <!--        <p class="m-title">You will receive LP ETH-KLAY Tokens</p> -->
        <!--        <div class="m-head"> -->
        <!--          <img :src="selectedTokens.tokenA.logo" alt="" /> -->
        <!--          <img :src="selectedTokens.tokenB.logo" alt="" /> -->
        <!--          <p>3.6747823</p> -->
        <!--        </div> -->

        <div v-if="isValid" class="liquidity--details">
          <h3>Prices and pool share</h3>

          <div class="liquidity--details--row">
            <span>
              {{ selectedTokens.tokenA.symbol }} per
              {{ selectedTokens.tokenB.symbol }}
            </span>
            <span>
              {{
                getFormattedRate(
                  selectedTokens.tokenA.value,
                  selectedTokens.tokenB.value,
                )
              }}
            </span>
          </div>
          <div class="liquidity--details--row">
            <span>
              {{ selectedTokens.tokenB.symbol }} per
              {{ selectedTokens.tokenA.symbol }}
            </span>
            <span>
              {{
                getFormattedRate(
                  selectedTokens.tokenB.value,
                  selectedTokens.tokenA.value,
                )
              }}
            </span>
          </div>
          <div
            v-if="selectedTokens.pairBalance"
            class="liquidity--details--row"
          >
            <span>Share of pool</span>
            <span>
              {{
                getFormattedPercent(
                  selectedTokens.pairBalance,
                  selectedTokens.userBalance,
                )
              }}
            </span>
          </div>
          <!--          <div class="liquidity&#45;&#45;details&#45;&#45;row"> -->
          <!--            <span>You'll earn</span> -->
          <!--            <span>0.17%</span> -->
          <!--          </div> -->

          <!--          <div class="liquidity&#45;&#45;details&#45;&#45;row"> -->
          <!--            <span>Transaction Fee</span> -->
          <!--            <span>0.074 KLAY ($0.013)</span> -->
          <!--          </div> -->
        </div>

        <KlayButton
          type="button"
          :disabled="status === 'in_progress'"
          class="liquidity--btn"
          @click="handleAddLiquidity"
        >
          {{ status === "in_progress" ? "Wait" : "Supply" }}
        </KlayButton>
      </div>
      <div v-else-if="status === 'submitted'" class="m-content">
        <div class="submitted">
          <p>Transaction Submitted</p>
          <!--          <a href="#"> View on BscScan </a> -->
        </div>
        <KlayButton type="button" @click="$emit('close')">
          Close
        </KlayButton>
      </div>
    </div>
  </KlayModal>
</template>

<style lang="scss" scoped src="./index.scss"></style>
