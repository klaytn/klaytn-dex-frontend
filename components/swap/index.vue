<template>
  <div v-if="isLoading" class="wrap">
    <div class="head">
      <button class="head--btn head--btn-active">Swap</button>
      <button class="head--btn">Liquidity</button>
      <button class="head--btn head--btn-left" @click="onRefresh">
        <Icon name="refresh" />
      </button>
      <button class="head--btn">
        <Icon name="filters" />
      </button>
    </div>
    <div class="load">
      <Loader />
    </div>
  </div>

  <div v-else class="wrap">
    <div class="head">
      <button class="head--btn head--btn-active">Swap</button>
      <button class="head--btn">Liquidity</button>
      <button class="head--btn head--btn-left">
        <Icon name="refresh" />
      </button>
      <button class="head--btn">
        <Icon name="filters" />
      </button>
    </div>

    <TokenInput token-type="tokenA" />

    <button class="change-btn">
      <Icon name="arrow-down" />
    </button>

    <div class="margin-block">
      <TokenInput token-type="tokenB" />
    </div>

    <div class="slippage">
      <Slippage />
    </div>

    <Button :disabled="!isValidTokens">Swap</Button>

    <!--    <div class="slippage">-->
    <!--      <Collapse label="Transaction Details">-->
    <!--        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Delectus dolorum ea excepturi facilis nam nihil,-->
    <!--        provident voluptas voluptates. Accusamus magni natus obcaecati omnis reprehenderit! Doloremque quos, voluptatem!-->
    <!--        Odit repudiandae, unde!-->
    <!--      </Collapse>-->
    <!--    </div>-->

    <div v-if="exchangeRateLoading">Exchange rate loading</div>

    <div v-if="pairNotExist">Pair doesn't exist</div>
  </div>
</template>

<script>
import { mapActions, mapMutations, mapState } from "vuex";

export default {
  name: "KlaySwap",
  computed: {
    ...mapState("swap", [
      "selectedTokens",
      "tokensList",
      "exchangeRateLoading",
      "pairNotExist",
    ]),
    isLoading() {
      return !this.tokensList?.length;
    },
    isValidTokens() {
      return (
        Number(this.selectedTokens.tokenA?.balance) > 0 &&
        Number(this.selectedTokens.tokenB?.balance) > 0
      );
    },
  },
  beforeMount() {
    this.getTokens();
  },
  methods: {
    ...mapActions({
      getTokens: "swap/getTokens",
    }),
    ...mapMutations({
      refreshStore: "swap/REFRESH_STORE",
    }),
    onRefresh() {
      this.refreshStore();
    },
  },
};
</script>

<style lang="scss" scoped src="./index.scss" />
