<script>
export default {
  name: 'LiquidityAdd',
}
</script>

<template>
  <KlayWrap>
    <template #head>
      <RouterLink to="/liquidity" class="back">
        <KlayIcon name="back-arrow" />
        <span>
          Add Liquidity
        </span>
      </RouterLink>
    </template>
    <div class="add-liq">
      <LiquidityModuleAdd />
    </div>
  </KlayWrap>
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
