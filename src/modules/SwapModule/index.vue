<script lang="ts" setup>
import { isNativeToken } from '@/core/kaikas'
import { useTask } from '@vue-kakuyaku/core'
import invariant from 'tiny-invariant'
import { storeToRefs } from 'pinia'

const tokensStore = useTokensStore()
const { selectedTokens, computedToken, tokensList } = $(storeToRefs(tokensStore))

const swapStore = useSwapStore()
const { pairNotExist, exchangeRateLoading } = $(storeToRefs(swapStore))

const isLoading = $computed(() => !tokensList.length)

onBeforeUnmount(() => {
  swapStore.reset()
  tokensStore.clearSelectedTokens()
})

function onRefreshClick() {
  swapStore.reset()
}

const swapTokensTask = useTask(async () => {
  invariant(selectedTokens.tokenA && selectedTokens.tokenB)

  const isWKLAY = isNativeToken(selectedTokens.tokenA.address) || isNativeToken(selectedTokens.tokenB.address)

  if (isWKLAY) await swapStore.swapForKlayTokensTask.run()
  else {
    if (computedToken === 'tokenB') await swapStore.swapExactTokensForTokensTask.run()
    if (computedToken === 'tokenA') await swapStore.swapTokensForExactTokensTask.run()
  }

  // FIXME unsafe way to set an interval
  // if (this.exchangeRateIntervalID) {
  //   clearInterval(this.exchangeRateIntervalID)
  //   this.setExchangeRateIntervalID(null)
  // }
})
const isSwapLoading = $computed(() => swapTokensTask.state.kind === 'pending')

const isValidTokens = $computed(
  () =>
    !isSwapLoading &&
    !selectedTokens.emptyPair &&
    Number(selectedTokens.tokenA?.balance) >= 0 &&
    Number(selectedTokens.tokenB?.balance) >= 0,
)
</script>

<template>
  <div
    v-if="isLoading"
    class="wrap"
  >
    <div class="head">
      <button class="head--btn head--btn-active">
        Swap
      </button>
      <button class="head--btn">
        Liquidity
      </button>
      <button
        class="head--btn head--btn-left"
        @click="onRefreshClick()"
      >
        <KlayIcon name="refresh" />
      </button>
      <button class="head--btn">
        <KlayIcon name="filters" />
      </button>
    </div>
    <div class="load">
      <KlayLoader />
    </div>
  </div>

  <KlayWrap v-else>
    <SwapModuleExchangeRate />

    <div class="slippage">
      <KlaySlippage />
    </div>

    <KlayButton
      :disabled="!isValidTokens"
      @click="swapTokensTask.run()"
    >
      {{ isSwapLoading ? 'Wait' : 'Swap' }}
    </KlayButton>

    <SwapModuleDetails />

    <div v-if="exchangeRateLoading">
      Exchange rate loading
    </div>

    <div v-if="pairNotExist">
      Pair doesn't exist
    </div>
  </KlayWrap>
</template>

<style lang="scss" scoped>
.wrap {
  background: linear-gradient(0deg, #ffffff, #ffffff),
    linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.6);
  box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.05);
  padding: 19px 16px;
  border-radius: 20px;
  overflow: visible;
  margin: auto;
  max-width: 420px;
  width: 100%;
}

.load {
  width: min-content;
  margin: auto;
}

.head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 18px;

  &--btn {
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 150%;
    color: $gray2;
    margin-right: 18px;
    cursor: pointer;

    &-left {
      margin-left: auto;
    }

    &:last-child {
      margin-right: 0;
    }

    &-active {
      color: $dark;
    }
  }
}

.slippage {
  margin: 20px 0;
}
</style>
