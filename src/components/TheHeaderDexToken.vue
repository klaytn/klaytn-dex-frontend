<script setup lang="ts">
import { DEX_TOKEN, DEX_TOKEN_FULL } from '@/core'

const tokensStore = useTokensStore()

const dexDerivedUsd = computed(() => tokensStore.lookupDerivedUsd(DEX_TOKEN))

const balance = computed(() => tokensStore.lookupUserBalance(DEX_TOKEN)?.decimals(DEX_TOKEN_FULL) ?? null)

const balancePrice = computed(() => {
  const usd = dexDerivedUsd.value
  const token = balance.value
  return usd && token && token.times(usd)
})
</script>

<template>
  <div
    v-if="balance"
    class="token rounded-lg p-3 flex items-center space-x-1 mr-2"
  >
    <div class="balance">
      <CurrencyFormatTruncate
        :amount="balance"
        :decimals="DEX_TOKEN_FULL.decimals"
        :symbol="DEX_TOKEN_FULL.symbol"
        symbol-position="left"
        :max-width="56"
      />
    </div>
    <div
      v-if="balancePrice"
      class="price"
    >
      (<CurrencyFormatTruncate
        :amount="balancePrice"
        usd
        :max-width="56"
      />)
    </div>
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
