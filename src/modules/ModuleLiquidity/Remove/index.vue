<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { formatWeiValue } from '@/utils/common'

const tokensStore = useTokensStore()
const { selectedTokens } = $(storeToRefs(tokensStore))

const liquidityStore = useLiquidityStore()
const { removeLiquidityPair } = $(storeToRefs(liquidityStore))

// TODO move out from setup
const ACTIVE_VALUES = ['amount', 'detailed'] as const
type Active = typeof ACTIVE_VALUES[number]
function activeLabel(value: Active): string {
  return value === 'amount' ? 'Amount' : 'Detailed'
}

const active = $ref<Active>('amount')
</script>

<template>
  <div class="rl--wrap">
    <div class="switch">
      <div
        v-for="i in ACTIVE_VALUES"
        :key="i"
        :class="[
          'switch--item',
          {
            'switch--item-active': active === i,
          },
        ]"
        @click="active = i"
      >
        {{ activeLabel(i) }}
      </div>
    </div>

    <LiquidityModuleRemoveAmount v-if="active === 'amount'" />
    <LiquidityModuleRemoveDetailed v-else />

    <KlayButton
      type="button"
      class="mt"
      @click="liquidityStore.removeLiquidity()"
    >
      Remove
    </KlayButton>

    <div class="mt">
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
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars.sass';

.mt {
  margin-top: 16px;
}

.switch {
  max-width: 177px;
  width: 100%;
  background: $gray6;
  border-radius: 10px;
  padding: 4px;
  display: flex;
  justify-content: space-between;
  position: relative;

  &--item {
    padding: 6px 12px;
    background: transparent;
    font-style: normal;
    font-weight: 700;
    font-size: 14px;
    line-height: 21px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    z-index: 2;
    border-radius: 10px;
    cursor: pointer;

    &-active {
      background: $blue;
      color: $white;
    }
  }
}

.rl {
  &--collapse-label {
    font-style: normal;
    font-weight: 700;
    font-size: 14px;
    line-height: 25px;
  }

  &--row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;

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
}
</style>
