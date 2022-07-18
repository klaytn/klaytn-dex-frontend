<script lang="ts" setup>
import { asWei, tokenWeiToRaw } from '@/core/kaikas'
import { TokensPair, TokenType } from '@/utils/pair'
import BigNumber from 'bignumber.js'
import { storeToRefs } from 'pinia'

const store = useLiquidityRmStore()
const { liquidityRaw, selectedTokensData: tokens, amounts } = storeToRefs(store)

type BrokenAmountType = typeof amounts['value'] extends null | infer V
  ? V extends TokensPair<any>
    ? V[TokenType]
    : never
  : never

function formatAmount(value: BrokenAmountType | null | undefined, token: TokenType) {
  const data = tokens.value[token]
  if (!data || !value) return '-'
  return new BigNumber(tokenWeiToRaw(data, asWei(value.toString()))).toFixed(4)
}
</script>

<template>
  <div class="detailed">
    <div class="detailed--input input-amount mt">
      <div class="input-amount--col">
        <input
          v-model="liquidityRaw"
          placeholder="0"
          type="number"
          class="input-amount--value"
        >
        <!-- <div class="input-amount--price">
          $284.22
        </div> -->
      </div>

      <div class="input-amount--col">
        <div class="input-amount--row">
          <button
            type="button"
            class="input-amount--max"
            @click="store.setLiquidityToMax()"
          >
            MAX
          </button>
          <span
            v-if="tokens.tokenA && tokens.tokenB"
            class="input-amount--tokens"
          >
            {{ tokens.tokenA.symbol }}-{{ tokens.tokenB.symbol }}
          </span>
        </div>
        <!-- <div class="input-amount--price">
          -
        </div> -->
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
          {{ formatAmount(amounts?.tokenA, 'tokenA') }}
        </div>
        <div class="input-amount--price">
          $284.22
        </div>
      </div>

      <div class="input-amount--col">
        <div class="input-amount--row">
          <span class="input-amount--tokens">
            {{ tokens.tokenA?.symbol }}
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
          <!-- {{ formatAmount(removeLiquidityPair.amount1) }} -->
          amount b
        </div>
        <div class="input-amount--price">
          $284.22
        </div>
      </div>
      <div class="input-amount--col">
        <div class="input-amount--row">
          <span class="input-amount--tokens">
            <!-- {{ selectedTokens.tokenB.symbol }} -->
            symbol b
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="tokens.tokenA && tokens.tokenB"
      class="detailed--details"
    >
      <div class="detailed--details--row">
        <div>
          {{ tokens.tokenA.symbol }} per
          {{ tokens.tokenB.symbol }}
        </div>
        <div>
          ?
          <!-- {{ formatRate(selectedTokens.tokenA.value, selectedTokens.tokenB.value) }}
          {{ selectedTokens.tokenA.symbol }} -->
        </div>
      </div>
      <div class="detailed--details--row">
        <div>
          {{ tokens.tokenB.symbol }} per
          {{ tokens.tokenA.symbol }}
        </div>
        <div>
          ?
          <!-- TODO [almost] duplication of previous row -->
          <!-- {{ formatRate(selectedTokens.tokenB.value, selectedTokens.tokenA.value) }}
          {{ selectedTokens.tokenB.symbol }} -->
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars.sass';

.detailed {
  .mt {
    margin-top: 20px;
  }

  &--icon {
    width: min-content;
    margin: auto;
  }

  &--details {
    padding: 16px;
    border-radius: 10px;
    border: 1px solid $gray5;
    text-align: left;
    margin-top: 10px;

    &--row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      & + * {
        margin-top: 10px;
      }

      & div {
        width: 50%;
        font-style: normal;
        font-weight: 600;
        font-size: 12px;
        color: $gray4;
      }

      & div:last-child {
        text-align: right;
      }
    }
  }
}

.input-amount {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  background: $gray6;
  padding: 8px 16px;
  border-radius: 8px;

  &--row {
    display: flex;
    align-items: center;
    width: 100%;
  }

  &--col {
    width: 47%;
    min-height: 57px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    &:last-child {
      text-align: right;
    }
  }

  &--value {
    font-style: normal;
    font-weight: 600;
    font-size: 30px;
    line-height: 39px;
    color: $dark2;
    border: none;
    max-width: 100%;
    background: transparent;
  }

  &--max {
    font-style: normal;
    font-weight: 700;
    font-size: 10px;
    line-height: 16px;
    background: $blue;
    padding: 4px 10px;
    border-radius: 8px;
    color: $white;
    cursor: pointer;
    margin-right: 8px;
  }

  &--price {
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;
    color: $gray4;
    width: 100%;
  }

  &--tokens {
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 17px;
    color: $dark2;
    margin-left: auto;
  }
}
</style>
