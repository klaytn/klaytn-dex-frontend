<script lang="ts" setup>
import { ValueEther, fromWei } from '@/core/kaikas'
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'
import { formatWeiValue } from '@/utils/common'

const liquidityStore = useLiquidityStore()
const tokensStore = useTokensStore()

const { selectedTokens } = $(storeToRefs(tokensStore))
const { removeLiquidityPair } = $(storeToRefs(liquidityStore))

let valueWei = $ref(9)

function onDragEnd(newValue: number) {
  valueWei = newValue

  invariant(selectedTokens.userBalance)

  const value = new BigNumber(selectedTokens.userBalance).dividedBy(100).multipliedBy(newValue).toFixed(0)
  const renderValue = new BigNumber(fromWei(value)).toFixed(5) as ValueEther<string>

  liquidityStore.setRmLiqValue(renderValue)
  liquidityStore.calcRemoveLiquidityAmounts(renderValue)
}
</script>

<template>
  <div class="rl-amount">
    <div class="rl-amount--wrap-slide">
      <div class="rl-amount--title">
        {{ valueWei }}%
      </div>
      <div class="rl-amount--slide">
        <KlaySlider
          v-model="valueWei"
          @drag-end="onDragEnd"
        />
      </div>
      <div class="rl-amount--tags">
        <button
          type="button"
          class="rl-amount--tag"
          @click="valueWei = 10"
        >
          10%
        </button>
        <button
          type="button"
          class="rl-amount--tag"
          @click="valueWei = 25"
        >
          25%
        </button>
        <button
          type="button"
          class="rl-amount--tag"
          @click="valueWei = 50"
        >
          50%
        </button>
        <button
          type="button"
          class="rl-amount--tag"
          @click="valueWei = 75"
        >
          75%
        </button>
        <button
          type="button"
          class="rl-amount--tag"
          @click="valueWei = 100"
        >
          max
        </button>
      </div>
    </div>

    <div class="rl-amount--receive">
      <div class="title">
        You will receive
      </div>

      <div
        v-if="removeLiquidityPair.amount0 && selectedTokens.tokenA"
        class="rl-amount--row"
      >
        <div>{{ selectedTokens.tokenA.symbol }}</div>
        <div>{{ formatWeiValue(removeLiquidityPair.amount0) }}</div>
      </div>

      <div
        v-if="removeLiquidityPair.amount1 && selectedTokens.tokenB"
        class="rl-amount--row"
      >
        <div>{{ selectedTokens.tokenB.symbol }}</div>
        <div>{{ formatWeiValue(removeLiquidityPair.amount1) }}</div>
      </div>

      <template v-if="selectedTokens.tokenA && selectedTokens.tokenB">
        <div class="rl-amount--row">
          <div>
            {{ selectedTokens.tokenA.symbol }}
            per
            {{ selectedTokens.tokenB.symbol }}
          </div>
          <div>-</div>
        </div>

        <div class="rl-amount--row">
          <div>
            {{ selectedTokens.tokenB.symbol }}
            per
            {{ selectedTokens.tokenA.symbol }}
          </div>
          <div>-</div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./index.scss" />
