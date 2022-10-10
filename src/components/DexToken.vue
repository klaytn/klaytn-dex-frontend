<script setup lang="ts">
import { DEX_TOKEN, DEX_TOKEN_FULL } from '@/core'

const tokensStore = useTokensStore()

const dexDerivedUsd = computed(() => tokensStore.lookupDerivedUsd(DEX_TOKEN))

const balance = computed(() => tokensStore.lookupUserBalance(DEX_TOKEN))

const balancePrice = computed(() => {
  const derived = dexDerivedUsd.value
  const value = balance.value
  return derived && value && value.asBigNum.times(derived)
})
</script>

<template>
  <div
    v-if="balance && balancePrice"
    class="token rounded-lg p-3 flex items-center space-x-2 mr-2"
  >
    <CurrencyFormatTruncate
      class="balance"
      :amount="balance.asBigNum"
      :symbol="DEX_TOKEN_FULL.symbol"
    />
    <CurrencyFormatTruncate
      class="price"
      :amount="balancePrice"
      usd
    />
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/vars';

.token {
  background: white;
  font-size: 12px;
}

.balance {
  font-weight: 700;
}

.price {
  color: $gray2;
}
</style>
