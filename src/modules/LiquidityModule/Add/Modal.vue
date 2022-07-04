<script lang="ts" setup>
import { isNativeToken } from '@/core/kaikas'
import { Status } from '@soramitsu-ui/ui'
import { useTask, wheneverTaskErrors, wheneverTaskSucceeds } from '@vue-kakuyaku/core'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import { formatPercent, formatRate } from '@/utils/common'
import DetailsRow from './DetailsRow.vue'
import Details from './Details.vue'

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

        <Details v-if="selectedTokens.tokenA?.value && selectedTokens.tokenB?.value">
          <h3>Prices and pool share</h3>

          <DetailsRow>
            <span>
              {{ selectedTokens.tokenA.symbol }} per
              {{ selectedTokens.tokenB.symbol }}
            </span>
            <span>
              {{ formatRate(selectedTokens.tokenA.value, selectedTokens.tokenB.value) }}
            </span>
          </DetailsRow>
          <DetailsRow>
            <span>
              {{ selectedTokens.tokenB.symbol }} per
              {{ selectedTokens.tokenA.symbol }}
            </span>
            <span>
              {{ formatRate(selectedTokens.tokenB.value, selectedTokens.tokenA.value) }}
            </span>
          </DetailsRow>
          <DetailsRow v-if="selectedTokens.pairBalance && selectedTokens.userBalance">
            <span>Share of pool</span>
            <span>
              {{ formatPercent(selectedTokens.pairBalance, selectedTokens.userBalance) }}
            </span>
          </DetailsRow>
          <!--          <div class="liquidity&#45;&#45;details&#45;&#45;row"> -->
          <!--            <span>You'll earn</span> -->
          <!--            <span>0.17%</span> -->
          <!--          </div> -->

          <!--          <div class="liquidity&#45;&#45;details&#45;&#45;row"> -->
          <!--            <span>Transaction Fee</span> -->
          <!--            <span>0.074 KLAY ($0.013)</span> -->
          <!--          </div> -->
        </Details>

        <KlayButton
          type="button"
          :disabled="isInProgress"
          class="btn"
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

<style lang="scss" scoped>
.slippage {
  margin-top: 16px;
}

.error {
  text-align: center;
  margin-top: 16px;
  font-weight: 700;
}

.submitted {
  padding-top: 98px;
  padding-bottom: 138px;
  text-align: center;

  & p {
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 180%;
    color: $dark2;
  }
}

.m-title {
  color: $dark2;
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  margin-bottom: 7px;
}

.m-content {
  padding: 16px;
  box-sizing: border-box;
}

.m-head {
  display: flex;
  align-items: center;
  font-style: normal;
  font-weight: 600;
  font-size: 30px;
  line-height: 36px;
  color: $dark2;

  & img {
    width: 36px;
  }
}

.btn {
  margin-top: 16px;
}
</style>
