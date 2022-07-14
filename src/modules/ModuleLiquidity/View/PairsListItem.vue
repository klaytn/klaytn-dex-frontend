<script setup lang="ts">
import { roundTo } from 'round-to'
import { toRefs } from '@vueuse/core'
import { LiquidityPairsPosition, LiquidityPairValueRaw } from '../query.liquidity-pairs'
import BigNumber from 'bignumber.js'
import { RouteName } from '@/types'

const props = defineProps<{
  data: LiquidityPairsPosition
}>()

const { liquidityTokenBalance, pair } = $(toRefs(toRef(props, 'data')))
const { name, reserve0, reserve1, reserveKLAY, reserveUSD, totalSupply, token0, token1 } = $(toRefs($$(pair)))

function formatValueRaw(value: LiquidityPairValueRaw) {
  return roundTo(Number(value), 5)
}

function formatPercent(v1: LiquidityPairValueRaw, v2: LiquidityPairValueRaw) {
  if (v1 === '0') return '0'
  const percent = new BigNumber(v1).dividedToIntegerBy(100)
  return `${new BigNumber(v2).dividedBy(percent).toFixed(2)}%`
}

const addLiquidityStore = useLiquidityAddStore()
const router = useRouter()

function goToAddLiquidity() {
  addLiquidityStore.setBoth({
    tokenA: token0.id,
    tokenB: token1.id,
  })
  router.push({ name: RouteName.LiquidityAdd })
}
</script>

<template>
  <KlayCollapse>
    <template #head>
      <div class="pair--head">
        <div class="pair--icon-f">
          <KlayCharAvatar :symbol="token0.symbol" />
        </div>
        <div class="pair--icon-s">
          <KlayCharAvatar :symbol="token1.symbol" />
        </div>

        <span class="pair--names"> {{ name }} </span>
        <span class="pair--rate">
          {{ formatValueRaw(totalSupply) }}
          <span class="pair--rate-gray">(${{ formatValueRaw(reserveUSD) }}) </span>
        </span>
      </div>
    </template>

    <template #main>
      <div class="pair--main">
        <div class="pair--info">
          <div class="pair--row">
            <span>Pooled {{ token0.name }}</span>
            <span>
              {{ formatValueRaw(reserve0) }}
            </span>
          </div>
          <div class="pair--row">
            <span>Pooled {{ token1.name }}</span>
            <span>
              {{ formatValueRaw(reserve1) }}
            </span>
          </div>
          <div class="pair--row">
            <span>Your pool tokens:</span>
            <span>
              {{ formatValueRaw(liquidityTokenBalance) }}
            </span>
          </div>
          <div class="pair--row">
            <span>Your pool share:</span>
            <span>
              {{ formatPercent(reserveKLAY, liquidityTokenBalance) }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 mt-4">
          <KlayButton @click="goToAddLiquidity()">
            Add
          </KlayButton>
          <KlayButton disabled>
            Remove
          </KlayButton>
          <KlayButton
            type="primary"
            disabled
          >
            Deposit
          </KlayButton>
        </div>
      </div>
    </template>
  </KlayCollapse>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.pair {
  &--head {
    display: flex;
    align-items: center;
    padding: 5px 0;
    cursor: pointer;
    width: 100%;
  }
  &--icon-f,
  &--icon-s {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: block;
  }
  &--icon-s {
    margin-left: -10px;
    margin-right: 10px;
  }
  &--names {
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 17px;
    color: $dark;
    margin-right: 8px;
  }
  &--rate {
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 17px;
    color: $dark;
    &-gray {
      color: $gray4;
    }
  }
  &--info {
    margin-top: 11px;
  }
  &--row {
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 230%;
    color: $dark;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
