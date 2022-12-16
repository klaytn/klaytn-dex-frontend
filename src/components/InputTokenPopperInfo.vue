<script setup lang="ts">
import { Token, WeiAsToken } from '@/core'
import BigNumber from 'bignumber.js'

const props = defineProps<{
  token: Token
  balance: WeiAsToken<BigNumber>
  derivedUsd?: BigNumber | null
}>()

const balanceAsUsd = computed(() => (props.derivedUsd ? props.derivedUsd.times(props.balance) : null))
</script>

<template>
  <div class="bg-white rounded-lg shadow-lg p-4 w-180px space-y-2">
    <div :class="$style.title">
      {{ token.name }} ({{ token.symbol }})
    </div>
    <div class="flex">
      <CurrencyFormatTruncate
        :amount="balance"
        :symbol="token.symbol"
        :class="$style.subtitle"
      />
    </div>
    <div class="flex">
      <CurrencyFormatTruncate
        usd
        :amount="balanceAsUsd"
        :class="$style.subtitle"
      />
    </div>
    <AddressCopy
      :address="token.address"
      :class="$style.addr"
    />
  </div>
</template>

<style lang="scss" module>
@use '@/styles/vars';

.title {
  font-weight: 700;
  font-size: 13px;
}

.subtitle,
.addr {
  font-weight: 500;
  font-size: 12px;
  line-height: 100%;
}
</style>
