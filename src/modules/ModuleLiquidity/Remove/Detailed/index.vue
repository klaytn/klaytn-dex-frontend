<script lang="ts" setup>
import { ValueEther, ValueWei, fromWei } from '@/core/kaikas'
import { formatWeiValue, formatRate } from '@/utils/common'
import { storeToRefs } from 'pinia'
import invariant from 'tiny-invariant'

const tokensStore = useTokensStore()
const { selectedTokens } = $(storeToRefs(tokensStore))

const liquidityStore = useLiquidityStore()
const { removeLiquidityPair } = $(storeToRefs(liquidityStore))

let lpTokenValue = $ref<null | ValueEther<string>>(removeLiquidityPair.lpTokenValue)

const onInputDebounced = useDebounceFn((value: ValueEther<string>) => {
  liquidityStore.setRmLiqValue(value)
  liquidityStore.calcRemoveLiquidityAmounts(value)
}, 500)

function onInput(e: Event) {
  onInputDebounced((e.target as HTMLInputElement).value as ValueEther<string>)
}

function setMax() {
  invariant(selectedTokens.userBalance)
  const valueEther = fromWei(selectedTokens.userBalance) as ValueEther<string>
  onInputDebounced(valueEther)
  lpTokenValue = valueEther
}

function formatAmount(value: string) {
  return formatWeiValue(value as ValueWei<string>)
}
</script>

<template>
  <div
    v-if="
      selectedTokens.tokenA?.value &&
        selectedTokens.tokenB?.value &&
        removeLiquidityPair.amount0 &&
        removeLiquidityPair.amount1
    "
    class="detailed"
  >
    <div class="detailed--input input-amount mt">
      <div class="input-amount--col">
        <input
          v-model="lpTokenValue"
          placeholder="0.345"
          type="number"
          class="input-amount--value"
          @input="onInput"
        >
        <div class="input-amount--price">
          $284.22
        </div>
      </div>

      <div class="input-amount--col">
        <div class="input-amount--row">
          <button
            type="button"
            class="input-amount--max"
            @click="setMax"
          >
            max
          </button>
          <!--          <img src="" alt=""> -->
          <!--          <img src="" alt=""> -->
          <span class="input-amount--tokens">
            {{ selectedTokens.tokenA.symbol }}-{{ selectedTokens.tokenB.symbol }}
          </span>
        </div>
        <div class="input-amount--price">
          -
        </div>
      </div>
    </div>

    <div class="detailed--icon">
      <IconKlayArrowDown />
    </div>

    <div class="detailed--input input-amount">
      <div class="input-amount--col">
        <div
          type="text"
          class="input-amount--value"
        >
          {{ formatAmount(removeLiquidityPair.amount0) }}
        </div>
        <div class="input-amount--price">
          $284.22
        </div>
      </div>

      <div class="input-amount--col">
        <div class="input-amount--row">
          <span class="input-amount--tokens">
            {{ selectedTokens.tokenA.symbol }}
          </span>
        </div>
      </div>
    </div>

    <div class="detailed--icon">
      <IconKlayPlus />
    </div>

    <div class="detailed--input input-amount">
      <div class="input-amount--col">
        <div
          type="text"
          class="input-amount--value"
        >
          {{ formatAmount(removeLiquidityPair.amount1) }}
        </div>
        <div class="input-amount--price">
          $284.22
        </div>
      </div>
      <div class="input-amount--col">
        <div class="input-amount--row">
          <span class="input-amount--tokens">
            {{ selectedTokens.tokenB.symbol }}
          </span>
        </div>
      </div>
    </div>

    <div class="detailed--details">
      <div class="detailed--details--row">
        <div>
          {{ selectedTokens.tokenA.symbol }} per
          {{ selectedTokens.tokenB.symbol }}
        </div>
        <div>
          {{ formatRate(selectedTokens.tokenA.value, selectedTokens.tokenB.value) }}
          {{ selectedTokens.tokenA.symbol }}
        </div>
      </div>
      <div class="detailed--details--row">
        <div>
          {{ selectedTokens.tokenB.symbol }} per
          {{ selectedTokens.tokenA.symbol }}
        </div>
        <div>
          {{ formatRate(selectedTokens.tokenB.value, selectedTokens.tokenA.value) }}
          {{ selectedTokens.tokenB.symbol }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="./index.scss" scoped />
