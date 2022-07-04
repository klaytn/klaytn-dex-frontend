<script lang="ts" setup>
import { isNativeToken } from '@/core/kaikas'
import { Status } from '@soramitsu-ui/ui'
import { useTask, wheneverTaskErrors, wheneverTaskSucceeds } from '@vue-kakuyaku/core'
import { mapActions, mapState, storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import { formatPercent, formatRate } from '@/utils/common'

const emit = defineEmits(['close'])

const tokensStore = useTokensStore()
const { selectedTokens, computedToken } = $(storeToRefs(tokensStore))

const liquidityStore = useLiquidityStore()

const addLiquidityTask = useTask(async () => {
  const { tokenA, tokenB } = selectedTokens
  invariant(tokenA && tokenB)

  const isKlayToken = isNativeToken(tokenA.address) && isNativeToken(tokenB.address)

  if (isKlayToken) {
    await liquidityStore.addLiquidityETH()
  } else if (computedToken === 'tokenA') {
    await liquidityStore.addLiquidityAmount('in')
  } else if (computedToken === 'tokenB') {
    await liquidityStore.addLiquidityAmount('out')
  }
})

const isSubmitted = $computed(() => addLiquidityTask.state.kind === 'ok')
const isInProgress = $computed(() => addLiquidityTask.state.kind === 'pending')

wheneverTaskErrors(addLiquidityTask, () => {
  $notify({ status: Status.Error, description: 'Transaction Reverted' })
})

wheneverTaskSucceeds(addLiquidityTask, () => {
  $notify({ status: Status.Error, description: 'Transaction Reverted' })
})
</script>

<template>
  <KlayModal
    width="344"
    label="Confirm Supply"
    @close="$emit('close')"
  >
    <div>
      <div
        v-if="!isSubmitted"
        class="m-content"
      >
        <!--        <p class="m-title">You will receive LP ETH-KLAY Tokens</p> -->
        <!--        <div class="m-head"> -->
        <!--          <img :src="selectedTokens.tokenA.logo" alt="" /> -->
        <!--          <img :src="selectedTokens.tokenB.logo" alt="" /> -->
        <!--          <p>3.6747823</p> -->
        <!--        </div> -->

        <div
          v-if="selectedTokens.tokenA?.value && selectedTokens.tokenB?.value"
          class="liquidity--details"
        >
          <h3>Prices and pool share</h3>

          <div class="liquidity--details--row">
            <span>
              {{ selectedTokens.tokenA.symbol }} per
              {{ selectedTokens.tokenB.symbol }}
            </span>
            <span>
              {{ formatRate(selectedTokens.tokenA.value, selectedTokens.tokenB.value) }}
            </span>
          </div>
          <div class="liquidity--details--row">
            <span>
              {{ selectedTokens.tokenB.symbol }} per
              {{ selectedTokens.tokenA.symbol }}
            </span>
            <span>
              {{ formatRate(selectedTokens.tokenB.value, selectedTokens.tokenA.value) }}
            </span>
          </div>
          <div
            v-if="selectedTokens.pairBalance && selectedTokens.userBalance"
            class="liquidity--details--row"
          >
            <span>Share of pool</span>
            <span>
              {{ formatPercent(selectedTokens.pairBalance, selectedTokens.userBalance) }}
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
          :disabled="isInProgress"
          class="liquidity--btn"
          @click="addLiquidityTask.run()"
        >
          {{ isInProgress ? 'Wait' : 'Supply' }}
        </KlayButton>
      </div>

      <div
        v-else
        class="m-content"
      >
        <div class="submitted">
          <p>Transaction Submitted</p>
          <!--          <a href="#"> View on BscScan </a> -->
        </div>
        <KlayButton
          type="button"
          @click="emit('close')"
        >
          Close
        </KlayButton>
      </div>
    </div>
  </KlayModal>
</template>

<style lang="scss" scoped src="./index.scss"></style>
