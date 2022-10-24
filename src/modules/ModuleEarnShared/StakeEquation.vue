<script setup lang="ts">
import BigNumber from 'bignumber.js'
import { WeiAsToken } from '@/core'

defineProps<{
  staked: WeiAsToken<BigNumber>
  stakeAmount: WeiAsToken<BigNumber>
}>()
</script>

<template>
  <div class="equation">
    <div class="equation-item">
      <span class="equation-item-title">
        Staked
      </span>
      <CurrencyFormatTruncate
        class="equation-item-value"
        :amount="staked"
        :max-width="118"
      />
    </div>
    +
    <div class="equation-item">
      <span class="equation-item-title">
        Additional
      </span>
      <CurrencyFormatTruncate
        class="equation-item-value"
        :amount="stakeAmount"
        :max-width="118"
      />
    </div>
    =
    <div class="equation-item">
      <span class="equation-item-title">
        Total
      </span>
      <CurrencyFormatTruncate
        class="equation-item-value"
        :amount="staked.plus(stakeAmount)"
        :max-width="118"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.equation {
  font-weight: 600;
  font-size: 16px;
  padding: 16px;
  border: 1px solid vars.$gray5;
  border-radius: 8px;

  &-item {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    vertical-align: bottom;
    &-title {
      top: 0;
      margin-bottom: 6px;
      font-weight: 500;
      font-size: 12px;
      color: vars.$gray2;
    }
  }
}
</style>