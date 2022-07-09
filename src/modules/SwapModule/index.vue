<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const tokensStore = useTokensStore()
const { areImportedTokensLoaded } = $(storeToRefs(tokensStore))

const swapStore = useSwapStore()
const { areSelectedTokensValidToSwap, isEmptyPairAddress, swapState } = $(storeToRefs(swapStore))

onBeforeUnmount(() => {
  swapStore.reset()
})

function refresh() {
  swapStore.reset()
}
</script>

<template>
  <div
    v-if="!areImportedTokensLoaded"
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
        @click="refresh()"
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

    <!-- <div class="slippage">
      <KlaySlippage />
    </div> -->

    <KlayButton
      :disabled="!areSelectedTokensValidToSwap"
      @click="swapStore.swap"
    >
      {{ swapState.pending ? 'Wait' : 'Swap' }}
    </KlayButton>

    <SwapModuleDetails />

    <!-- <div v-if="exchangeRateLoading">
      Exchange rate loading
    </div> -->

    <div v-if="isEmptyPairAddress === 'empty'">
      Pair doesn't exist
    </div>
  </KlayWrap>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

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
