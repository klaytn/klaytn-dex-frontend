<script lang="ts" setup>
import { isNativeToken } from '@/core/kaikas'
import { useTask } from '@vue-kakuyaku/core'
import invariant from 'tiny-invariant'

const swapStore = useSwapStore()
const tokensStore = useTokensStore()

const selectedTokens = $computed(() => tokensStore.state.selectedTokens)
const computedToken = $computed(() => tokensStore.state.computedToken)

const pairNotExist = $computed(() => swapStore.state.pairNotExist)
const exchangeRateLoading = $computed(() => swapStore.state.exchangeRateLoading)

const isLoading = $computed(() => !tokensStore.state.tokensList.length)

onBeforeUnmount(() => {
  swapStore.$reset()
  tokensStore.clearSelectedTokens()
})

function onRefreshClick() {
  swapStore.$reset()
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
    !tokensStore.state.selectedTokens.emptyPair &&
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

<style lang="scss" scoped src="./index.scss" />
