<template>
  <KlayCollapse>
    <template #head>
      <div class="rl--collapse-label">
        LP tokens details
      </div>
    </template>
    <template #main>
      <div
        v-if="selectedTokens.tokenA"
        class="rl--row"
      >
        <div>{{ selectedTokens.tokenA.symbol }}</div>
        <div>
          {{ removeLiquidityPair.amount0 && formatWeiValue(removeLiquidityPair.amount0) }}
        </div>
      </div>
      <div
        v-if="selectedTokens.tokenB"
        class="rl--row"
      >
        <div>{{ selectedTokens.tokenB.symbol }}</div>
        <div>
          {{ removeLiquidityPair.amount1 && formatWeiValue(removeLiquidityPair.amount1) }}
        </div>
      </div>
      <div
        v-if="selectedTokens.tokenA && selectedTokens.tokenB"
        class="rl--row"
      >
        <div>
          {{ selectedTokens.tokenA.symbol }} per
          {{ selectedTokens.tokenB.symbol }}
        </div>
        <div>-</div>
      </div>
      <div
        v-if="selectedTokens.tokenA && selectedTokens.tokenB"
        class="rl--row"
      >
        <div>
          {{ selectedTokens.tokenB.symbol }} per
          {{ selectedTokens.tokenA.symbol }}
        </div>
        <div>-</div>
      </div>
    </template>
  </KlayCollapse>
</template>
