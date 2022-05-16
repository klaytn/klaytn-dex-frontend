<template>
  <Wrap>
    <template v-slot:head>
      <RouterLink to="/liquidity" class="back">
        <Icon name="back-arrow" />
        <span> Remove ETH-DAI liquidity </span>
      </RouterLink>
    </template>
    <template>
      <div class="add-liq">
        <LiquidityRemove></LiquidityRemove>
      </div>
    </template>
  </Wrap>
</template>

<style lang="scss" scoped>
.back {
  font-weight: 700;
  font-size: 18px;
  line-height: 22px;
  color: $dark2;
  display: flex;
  align-items: center;

  & span {
    margin-left: 11px;
  }
}
</style>
