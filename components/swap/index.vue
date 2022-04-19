<template>
  <div class="wrap">

    <div class="head">
      <button class="head--btn head--btn-active">
        Swap
      </button>
      <button class="head--btn">
        Liquidity
      </button>
      <button class="head--btn head--btn-left">
        <Icon name="refresh"></Icon>
      </button>
      <button class="head--btn">
        <Icon name="filters"></Icon>
      </button>
    </div>

    <TokenInput tokenType="tokenA"></TokenInput>

    <button class="change-btn">
      <Icon name="arrow-down"></Icon>
    </button>

    <div class="margin-block">
      <TokenInput tokenType="tokenB"></TokenInput>
    </div>

    <div class="slippage">
      <Collapse label="Slippage tolerance">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Delectus dolorum ea excepturi facilis nam nihil,
        provident voluptas voluptates. Accusamus magni natus obcaecati omnis reprehenderit! Doloremque quos, voluptatem!
        Odit repudiandae, unde!
      </Collapse>
    </div>

    <Button :disabled="!isValidTokens">Swap</Button>

    <div class="slippage">
      <Collapse label="Transaction Details">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Delectus dolorum ea excepturi facilis nam nihil,
        provident voluptas voluptates. Accusamus magni natus obcaecati omnis reprehenderit! Doloremque quos, voluptatem!
        Odit repudiandae, unde!
      </Collapse>
    </div>
  </div>
</template>

<script>
import {mapActions} from "vuex";

export default {
  name: 'Swap',
  methods: {
    ...mapActions({
      getTokens: 'swap/getTokens'
    })
  },
  computed: {
    isValidTokens(){
      return this.$store.state.swap.selectedTokens['tokenA'] && this.$store.state.swap.selectedTokens['tokenB']
    }
  },
  beforeMount() {
    this.getTokens()
  }
}

</script>

<style lang="scss" scoped>
.wrap {
  background: linear-gradient(0deg, #FFFFFF, #FFFFFF), linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.6);
  box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.05);
  padding: 19px 16px;
  border-radius: 20px;
  overflow: visible;
  margin: auto;
  max-width: 420px;
  width: 100%;
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
      color: $dark
    }
  }
}

.change-btn {
  margin-top: -10px;
}

.margin-block {
  margin: -10px 0;
}

.slippage {
  margin: 20px 0;
}
</style>
