<template>
  <div>
    <h4>
      <span> You will receive </span>
      <IconKlayImportant />
    </h4>

    <div
      v-if="removeLiquidityPair.amount0 && selectedTokens.tokenA"
      class="row"
    >
      <div>{{ selectedTokens.tokenA.symbol }}</div>
      <div>{{ formatWeiValue(removeLiquidityPair.amount0) }}</div>
    </div>

    <div
      v-if="removeLiquidityPair.amount1 && selectedTokens.tokenB"
      class="row"
    >
      <div>{{ selectedTokens.tokenB.symbol }}</div>
      <div>{{ formatWeiValue(removeLiquidityPair.amount1) }}</div>
    </div>

    <template v-if="selectedTokens.tokenA && selectedTokens.tokenB">
      <div class="row">
        <div>
          {{ selectedTokens.tokenA.symbol }}
          per
          {{ selectedTokens.tokenB.symbol }}
        </div>
        <div>-</div>
      </div>

      <div class="row">
        <div>
          {{ selectedTokens.tokenB.symbol }}
          per
          {{ selectedTokens.tokenA.symbol }}
        </div>
        <div>-</div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  & div {
    width: 50%;
    font-style: normal;
    font-weight: 600;
    font-size: 12px;
  }

  & div:last-child {
    text-align: right;
  }
}
</style>
