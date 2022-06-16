<template>
  <Wrap>
    <template v-slot:head>
      <RouterLink to="/liquidity" class="back">
        <Icon name="back-arrow"/>
        <span>
          Add Liquidity
        </span>
      </RouterLink>
    </template>
    <template>
      <div class="add-liq">
        <LiquidityAdd></LiquidityAdd>
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
