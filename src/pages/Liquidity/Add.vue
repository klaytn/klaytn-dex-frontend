<route lang="yaml">
name: LiquidityAdd
</route>

<script setup lang="ts" name="LiquidityAdd" />

<template>
  <TradeWrap>
    <template #head>
      <RouterLink
        to="/liquidity"
        class="back"
      >
        <KlayIcon name="back-arrow" />
        <span> Add Liquidity </span>
      </RouterLink>
    </template>
    <div class="add-liq">
      <LiquidityModuleAdd />
    </div>
  </TradeWrap>
</template>

<style lang="scss" scoped>
@import '@/styles/vars.sass';

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
