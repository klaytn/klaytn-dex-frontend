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

<style lang="scss" scoped src="./index.scss" />
